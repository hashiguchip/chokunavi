---
name: pr-review
description: PR をレビューする（マルチエージェント並列レビュー）
allowed-tools: Bash, Read, Grep, Glob, Agent
argument-hint: "{PR number}"
---

指定された PR 番号の GitHub Pull Request をマルチエージェントで並列レビューしてください。

## 手順

### 1. 前提チェック

以下を確認し、問題があれば中断:

- `$ARGUMENTS` が数値であること。未指定・非数値なら「使い方: `/pr-review {PR番号}`」と表示して中断
- `gh auth status` で GitHub CLI の認証を確認（未認証なら `gh auth login` を案内）
- `gh pr view $ARGUMENTS --json state,title` で PR の存在を確認。存在しなければ中断。MERGED/CLOSED の場合は警告しつつ続行

### 2. PR データ取得

以下を並列実行し、結果を保持:

- `gh pr view $ARGUMENTS --json title,body,additions,deletions,changedFiles,baseRefName,headRefName,commits,labels`
- `gh pr diff $ARGUMENTS`
- `gh pr view $ARGUMENTS --json files --jq '.files[].path'`

### 3. 並列エージェントレビュー

取得した PR メタデータと diff を各エージェントのプロンプトに含め、**4つの Agent を同時に起動**する。
各エージェントには「出力は JSON 形式で返すこと」と指示し、以下のスキーマに従わせる:

```json
[
  {
    "severity": "error" | "warning" | "info",
    "category": "Convention" | "Bug" | "Security" | "Quality",
    "file": "src/components/Foo.tsx",
    "line": 42,
    "issue": "問題の説明"
  }
]
```

#### Agent 1: 規約準拠チェック（model: "sonnet"）

- `CLAUDE.md` を Read してプロジェクト規約を取得
- 変更ファイルごとに以下をチェック:
  - named export を使用しているか（default export 不可）
  - Props 型が `type Props = { ... }` でコンポーネント直上に定義されているか
  - `"use client"` は状態・イベントが必要な場合のみ使用されているか
  - インポートに `@/*` パスエイリアスを使用しているか
  - ダブルクォート・セミコロン（Biome 設定準拠）
  - コミットメッセージが Conventional Commits 形式か
- diff だけでは判断できない場合は変更ファイルの全文を Read する

#### Agent 2: バグ・ロジック分析

- diff を精査し以下を検出:
  - 型エラー・型の不整合
  - null/undefined アクセスリスク
  - ロジックエラー（条件分岐の抜け、off-by-one）
  - エラーハンドリングの欠落
  - エッジケースの見落とし
  - デッドコード・到達不能コード
  - デバッグコード（console.log 等）の残存
- 必要に応じて関連ファイルを Read して前後の文脈を確認

#### Agent 3: セキュリティ・diff 衛生（model: "sonnet"）

- セキュリティ:
  - ハードコードされた API キー・シークレット
  - XSS ベクター（`dangerouslySetInnerHTML` 等）
  - `.env` ファイルの露出
  - 外部入力のサニタイズ漏れ
- diff 衛生:
  - 意図しないファイル変更
  - コメントアウトされたコードの残存
  - 不要な空行・フォーマット変更のみの差分

#### Agent 4: スタイル・Tailwind 衛生（model: "sonnet"）

- 変更ファイルに `.tsx` / `.ts` / `.css` / `.scss` が**1つも含まれない**場合は即座に空配列 `[]` を返して終了
- `apps/web/CLAUDE.md` (nested) と `apps/web/src/app/globals.css` を Read してスタイル規約と `@theme` の token 一覧を取得
- 変更ファイルごとに以下をチェック:
  - **token 化された色のドリフト**: hex → token 置換で実際の色がズレていないか（例: `[#ccc]` → `neutral-300` (#dddddd) のような unit 差を catch）。`@theme` の値と元 hex を照合
  - **新規 arbitrary value の正当性**: 新しく追加された `[#xxx]` や `text-[14px]` 等が `apps/web/CLAUDE.md` の「Arbitrary を使ってよい」基準（layout 構造値 / opacity 変調 / 1 度限りの装飾 等）に該当するか。該当しなければ token 化候補として指摘
  - **重複・競合 class**: 同一 className 内で同じ property を 2 つ以上設定していないか（例: `text-sm text-base`, `bg-neutral-100 bg-white`, `mt-4 mt-2`）
  - **token 名のタイポ**: `text-neutarl-900` のような typo、または `globals.css` の `@theme` に存在しない token 参照
  - **意味的ロールの混在**: 似た用途で違う token を使い分けていないか（例: 同じ "secondary text" 用途で `text-neutral-700` と `text-neutral-800` が混在）
- diff だけでは判定できない場合は変更ファイルの全文を Read する

### 4. 結果マージ & レポート出力

全エージェントの結果を集約し、重複を除去した上で以下のフォーマットで出力:

```
## PR Review: #{number} — {title}

### Summary
(PR の概要 1-2文)

### Findings

#### 🔴 Errors
| # | Category | File | Line | Issue |
|---|----------|------|------|-------|
| 1 | Bug      | ...  | ...  | ...   |

#### 🟡 Warnings
| # | Category | File | Line | Issue |
|---|----------|------|------|-------|
| 1 | Convention | ... | ...  | ...  |

#### 🔵 Info
| # | Category | File | Line | Issue |
|---|----------|------|------|-------|
| 1 | Quality  | ...  | ...  | ...   |

(該当なしの severity セクションは省略)

### Convention Compliance
- [x] Named exports
- [x] type Props pattern
- [x] @/* imports
- [x] "use client" usage
- [x] Conventional Commits
- [x] Tailwind tokens preferred over arbitrary values (apps/web/CLAUDE.md)
- [x] No color drift in hex → token replacements
...

### Verdict
LGTM / Changes Suggested (N items)
```

- Findings が 0 件なら「No issues found.」と表示
- severity 別にグループ化（error → warning → info の順）

### 5. GitHub へのレビュー投稿（条件付き）

error / warning の指摘が **1件もない** 場合（info のみ or 指摘ゼロ）:

- `gh pr review $ARGUMENTS --comment --body "..."` で PR にレビューコメントを投稿:

```
✅ No issues found.
```

error / warning が **1件以上ある** 場合:

- GitHub には投稿しない（ターミナル出力のみ）
- Verdict に「⚠️ error/warning の指摘があるため GitHub への投稿はスキップしました」と追記
