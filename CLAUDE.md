# Resume 2026 - Portfolio Site

## Overview

求人票形式のポートフォリオサイト。静的サイトとして GitHub Pages にデプロイ。

## Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19
- **Language**: TypeScript 5 (strict mode)
- **Styling**: Tailwind CSS 4
- **State**: Zustand 5
- **Linter/Formatter**: Biome 2
- **Icons**: lucide-react
- **Utilities**: clsx

## Build & Deploy

- 静的エクスポート: `output: "export"` → `out/` ディレクトリ
- 本番 basePath: `/resume_2026`
- GitHub Pages でホスティング

## Directory Structure

```
src/
├── app/              # Next.js App Router (layout, page, globals.css)
├── components/
│   ├── ui/           # 汎用UIコンポーネント (H2, DLRow, etc.)
│   ├── sections/     # ページセクション (JobHeader, Skills, Projects, etc.)
│   └── layout/       # レイアウト (Header, Footer, SectionNav, Breadcrumb)
├── constants/        # 定数定義
├── libs/             # 内部ライブラリ (global-modal)
└── stores/           # Zustand ストア
```

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

### Commit Message (Conventional Commits)

- Format: `<type>(<scope>): <description>` — scope は任意
- Language: English

#### Types

| Type | 用途 | changelog |
|------|------|-----------|
| `feat` | 新機能 | 表示 |
| `fix` | バグ修正 | 表示 |
| `docs` | ドキュメントのみ | 非表示 |
| `style` | コードの意味に影響しない変更（空白、フォーマット等） | 非表示 |
| `refactor` | バグ修正でも機能追加でもないコード変更 | 非表示 |
| `perf` | パフォーマンス改善 | 非表示 |
| `test` | テストの追加・修正 | 非表示 |
| `build` | ビルド設定・本番依存の変更 | 非表示 |
| `ci` | CI/CD 設定の変更 | 非表示 |
| `chore` | 上記に当てはまらない雑務（dev依存、設定ファイル等） | 非表示 |

#### Examples

- `feat: add skills section`
- `fix(modal): prevent scroll on open`
- `chore: add /pr skill and PR template`
- `ci: add deploy workflow`

### Content

- UI テキスト・コンテンツは日本語
- コード中のコメントは日本語 OK
