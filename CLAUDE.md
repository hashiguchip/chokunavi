# Resume 2026 - チョクナビ

## Overview

求人票形式のポートフォリオサイト。静的サイトとして GitHub Pages にデプロイ。

## Sensitive Data

- コード・コメント・ドキュメントに**個人名・本名・個人情報を絶対に書かない**。「開発者」等の一般名詞で代替する
- commit message にも個人名・個人情報を含めない
- **外部サービス名（求人プラットフォーム名・エージェント名等）を commit message・PR タイトル・PR 本文に書かない**。公開リポジトリのため営業戦略が漏れる。「チャネル」「プラットフォーム」等の一般名詞で代替する
- **暗号化ファイル (`app-data.sops.bin`) の変更内容を commit message・PR に詳述しない**。SOPS で隠している情報（単価・紹介コード等）を公開テキストに書いたら暗号化の意味がない。commit message は `chore: update app data` 程度にとどめる

## Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19
- **Language**: TypeScript 5 (strict mode)
- **Styling**: Tailwind CSS 4
- **State**: Zustand 5
- **Linter/Formatter**: Biome 2
- **Git Hooks**: hk (Rust 製)
- **Commit Lint**: cocogitto (Rust 製)
- **Toolchain**: mise (ツールバージョン管理)
- **Icons**: lucide-react
- **Utilities**: clsx

## Build & Deploy

- 静的エクスポート: `output: "export"` → `out/` ディレクトリ
- 本番 basePath: `/chokunavi`
- GitHub Pages でホスティング

## Directory Structure

```
apps/
├── web/                # Next.js フロントエンド（自己完結）
│   ├── src/
│   │   ├── app/              # Next.js App Router (layout, page, globals.css)
│   │   ├── components/
│   │   │   ├── ui/           # 汎用UIコンポーネント (H2, DLRow, etc.)
│   │   │   ├── sections/     # ページセクション (JobHeader, Skills, Projects, etc.)
│   │   │   └── layout/       # レイアウト (Header, Footer, SectionNav, Breadcrumb)
│   │   ├── constants/        # 定数定義
│   │   ├── libs/             # 内部ライブラリ (http, global-modal, analytics)
│   │   ├── services/         # 外部サービスとの通信層 (API Layer)
│   │   └── stores/           # Zustand ストア
│   ├── public/
│   ├── package.json
│   ├── package-lock.json
│   ├── Dockerfile
│   ├── next.config.ts
│   ├── tsconfig.json
│   └── vitest.config.ts
└── api/                # Go backend (data-api)
    ├── main.go
    ├── main_test.go
    ├── go.mod
    ├── Dockerfile
    ├── Makefile
    └── .env.example
.mise.toml                    # ツールバージョン + タスク定義
hk.pkl                        # Git hooks (pre-commit, commit-msg)
cog.toml                      # Conventional Commits 設定
docker-compose.yml            # ローカル開発用（web + api）
biome.json                    # Linter/Formatter 設定（JS/TS/CSS 全体に適用）
```

### Development Commands

- `mise run dev` — Web dev server 起動
- `mise run build` — Web ビルド
- `mise run test` — Web テスト
- `mise run typecheck` — TypeScript 型チェック
- `mise run lint` — Biome lint
- `mise run lint:fix` — Biome lint + 自動修正
- `mise run dev:api` — API dev server 起動
- `mise run test:api` — API テスト

## Coding Conventions

### Formatting (Biome)

- インデント: スペース2
- クォート: ダブルクォート (`"`)
- セミコロン: あり (Biome デフォルト)

### Components

- **named export** を使用（default export は使わない）
- Server Components がデフォルト。`"use client"` は状態・イベントが必要な場合のみ
- Props 型は `type Props = { ... }` でコンポーネント直上に定義

### Imports

- パスエイリアス `@/*` → `./src/*` を使用
- Biome の organizeImports が有効

### Zustand

- `create<T>()(...)` パターンで型安全に定義
- ストアファイルは `src/stores/` に配置

### Environment Variables

- `process.env` を直接参照しない。`src/env.ts` の `env` オブジェクト経由でアクセスする
- 新しい環境変数を追加する場合は `src/env.ts` に zod スキーマとともに登録する
- 例外: `next.config.ts` での `NODE_ENV` 参照など、env.ts より前に評価されるファイル

### Branching

GitHub Flow ベース（trunk-based）。

- `main` が単一 trunk。常に deployable・green に保つ
- 作業は短命な feature branch で行う。ブランチ名 prefix は Conventional Commits の type に揃える（`feat/`, `fix/`, `refactor/`, `chore/`, `docs/`, `ci/` 等）— GitHub Flow 自体は命名を規定しないが、本プロジェクトの慣習
- ブランチは目安 1–3 日で main にマージ。長寿命化させない
- `develop` / `release/*` / `hotfix/*` は使わない
- マージは squash merge を基本とする（main の履歴を Conventional Commits 1行に保つため）
- main への直接 push は禁止。必ず PR 経由

### Commit Message (Conventional Commits)

- Format: `<type>(<scope>): <description>` — scope は任意
- Language: English

#### Types

| Type | 用途 | changelog |
|------|------|-----------|
| `feat` | 新機能（プロダクションに影響する変更） | 表示 |
| `fix` | バグ修正 | 表示 |
| `docs` | ドキュメントのみ | 非表示 |
| `style` | コードの意味に影響しない変更（空白、フォーマット等） | 非表示 |
| `refactor` | バグ修正でも機能追加でもないコード・構成の変更 | 非表示 |
| `perf` | パフォーマンス改善 | 非表示 |
| `test` | テストの追加・修正 | 非表示 |
| `build` | ビルド設定・本番依存の変更 | 非表示 |
| `ci` | CI/CD 設定の変更 | 非表示 |
| `chore` | 上記に当てはまらない雑務（dev依存、設定ファイル、.claude/ 等） | 非表示 |

#### Examples

- `feat: add skills section`
- `fix(modal): prevent scroll on open`
- `chore: add /pr skill and PR template`
- `ci: add deploy workflow`

### Content

- UI テキスト・コンテンツは日本語
- コード中のコメントは日本語 OK
