---
name: pr
description: 現在のブランチからPRを作成
allowed-tools: Bash
argument-hint: "[base-branch]"
---

現在のブランチから GitHub Pull Request を作成してください。
ベースブランチは `$ARGUMENTS`（未指定なら `main`）を使用。

## 手順

### 1. 前提チェック

以下を確認し、問題があれば中断:

- `gh auth status` で GitHub CLI の認証を確認（未認証なら `gh auth login` を案内）
- `git branch --show-current` で現在のブランチを取得。`main` なら「フィーチャーブランチで実行してください」と案内して中断
- `git status --porcelain` で未コミットの変更を確認。あればユーザーに警告し、先にコミットするか確認
- `gh pr view HEAD 2>/dev/null` で既存PRを確認。あればそのURLを表示して終了
- `gh pr list --head "$(git branch --show-current)" --state merged --json number,title` でマージ済みPRを確認。あれば「このブランチは既に #N でマージ済みです。新しいブランチを作成してください」と案内して中断

### 2. 品質チェック

以下を順番に実行。いずれか失敗したら中断してエラーを報告:

1. `npm run lint`
2. `npx tsc --noEmit`
3. `npm run build`

### 3. 変更分析・PR内容生成

- `git log --oneline <base>..HEAD` でコミット一覧を取得
- `git diff <base>...HEAD --stat` で変更ファイルサマリーを取得
- コミットメッセージを分析し、PRタイトルと本文を生成:
  - **タイトル**: コミットが1つならそのメッセージをそのまま使用。複数なら変更全体を要約
  - **本文**: `.github/pull_request_template.md` の形式に沿って以下を記入:
    - 概要: 変更の目的を 1-3 行で。"何を" だけでなく "なぜ" も書く
    - 変更タイプ: コミットメッセージの prefix (`feat:`, `fix:`, `refactor:` 等) から判定し、該当する項目にチェックを入れる。複数タイプがある場合は複数チェック
    - 変更内容: 各コミットの内容を箇条書き
    - スクリーンショット: UI 関連ファイル (`.tsx`, `.css`, スタイル関連) の変更がある場合は「UI 変更あり — マージ前にブラウザで確認してください」と記載。なければセクション自体を省略
    - テスト: Lint・型チェック・ビルドは ✅ 済みとしてチェック。ブラウザ確認・セルフレビューは未チェック
    - 関連 Issue: コミットメッセージに `#数字` があれば `Closes #数字` として記載。なければ省略
    - 備考: `🤖 Generated with [Claude Code](https://claude.com/claude-code)` を記載

### 4. Push & PR 作成

- `git push -u origin HEAD` でリモートにプッシュ
- `gh pr create --base <base> --title "<タイトル>" --body "<本文>"` で PR を作成
- body は HEREDOC で渡してフォーマットを維持すること

### 5. 報告

作成した PR の URL を表示。
