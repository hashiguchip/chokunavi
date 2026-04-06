# apps/web — Next.js Frontend

求人票形式ポートフォリオサイトのフロントエンド。`output: "export"` で静的サイト化し GitHub Pages に配信する。

> モノレポ全体の概要・横断ツール・セットアップは [ルート README](../../README.md) を参照。

## Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19
- **Language**: TypeScript 5 (strict)
- **Styling**: Tailwind CSS 4
- **State**: Zustand 5
- **Forms / Validation**: react-hook-form 7 + Zod 4
- **Env**: `@t3-oss/env-nextjs` (Zod スキーマで型安全に検証)
- **Test**: Vitest 4
- **Lint / Format**: Biome 2 (ルート `biome.json`)
- **Icons**: lucide-react
- **Utils**: clsx

## Directory

```
apps/web/
├── src/
│   ├── app/              # Next.js App Router (layout, page, globals.css)
│   ├── components/
│   │   ├── ui/           # 汎用 UI (H2, DLRow, ...)
│   │   ├── sections/     # ページセクション (JobHeader, Skills, Projects, ...)
│   │   └── layout/       # Header, Footer, SectionNav, Breadcrumb
│   ├── constants/        # 定数
│   ├── libs/             # 内部ライブラリ
│   ├── services/         # 外部 API 通信層
│   ├── stores/           # Zustand ストア
│   ├── utils/            # ユーティリティ
│   └── env.ts            # 環境変数 (zod スキーマ)
├── public/               # 静的アセット
├── next.config.ts
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── .env.example
└── Dockerfile          # debian + mise (cookbook 方式)、ルート .mise.toml を読み込む
```

## Commands

単独で web を起動するためのコマンド群。**フルスタック開発 (api と接続) では `docker compose up` を推奨** ([ルート README の Run セクション](../../README.md#run) を参照)。ルートから `mise run` でも `apps/web/` 内で `npm` 直接でも可。

| 用途             | mise (ルートから)    | npm (apps/web から)   |
| ---------------- | -------------------- | --------------------- |
| 開発サーバー起動 | `mise run dev`       | `npm run dev`         |
| 本番ビルド       | `mise run build`     | `npm run build`       |
| Vitest (1 回)    | `mise run test`      | `npm run test`        |
| Vitest (watch)   | —                    | `npm run test:watch`  |
| 型チェック       | `mise run typecheck` | `npm run typecheck`   |
| Lint             | `mise run lint`      | (ルートの biome を使用) |
| Format           | `mise run format`    | (ルートの biome を使用) |

> Biome はリポジトリ全体で統一管理しているため `apps/web/package.json` には `lint` スクリプトを置いていない。

## Environment Variables

`.env.example` をコピーして `.env` を作る:

```sh
cp .env.example .env
```

| 変数 | 必須 | 用途 |
| ---- | ---- | ---- |
| `NEXT_PUBLIC_GA_ID` | ✅ | Google Analytics 4 の measurement ID |
| `NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY` | ✅ | Web3Forms (お問い合わせフォーム) のアクセスキー |
| `NEXT_PUBLIC_DATA_API_URL` | 任意 | データ API (`apps/api`) のエンドポイント URL |

> ⚠ 現在 `.env.example` には `NEXT_PUBLIC_GA_ID` しか含まれていない。`NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY` は `src/env.ts` の Zod スキーマで必須なので、ローカル / CI 双方で別途設定する必要がある。

スキーマ定義は [`src/env.ts`](src/env.ts)。コード中で `process.env` を直接参照せず、必ず `import { env } from "@/env"` 経由で使うこと (CLAUDE.md ルール)。

## Docker

ルート [`docker-compose.yml`](../../docker-compose.yml) の `web` サービスから参照される (フルスタック開発時の推奨パス)。`apps/web/Dockerfile` は `debian:13-slim` をベースに **mise を組み込み**、ルートの [`.mise.toml`](../../.mise.toml) から Node のバージョンを解決する (host と完全一致、参考: [mise + Docker cookbook](https://mise.jdx.dev/mise-cookbook/docker.html))。`apps/web/src` を bind mount してホットリロード (`npm run dev` を実行)。

ビルドコンテキストはリポジトリルート (`context: .`) で、ルート [`.dockerignore`](../../.dockerignore) が build 対象を絞っている。

本番ビルド (静的エクスポート) は GitHub Actions 上で `next build` するため、Dockerfile はあくまでローカル開発用。

## Internal Libraries

`src/libs/` 配下のライブラリのうち、詳細ドキュメントを持つもの:

- [`src/libs/http/README.md`](src/libs/http/README.md) — Result 型ベースの HTTP クライアント
- [`src/libs/global-modal/README.md`](src/libs/global-modal/README.md) — スタック対応モーダル

## Build & Deploy

- [`next.config.ts`](next.config.ts) で `output: "export"` を設定 → `npm run build` で `out/` ディレクトリに静的サイトを生成
- 本番時のみ `basePath: "/resume_2026"` (リポジトリ名に合わせる)
- `images.unoptimized: true` (Next.js 画像最適化を無効化)

GitHub Pages へのデプロイは [`deploy-web.yml`](../../.github/workflows/deploy-web.yml) が `main` への push を契機に自動実行する (`apps/web/**` に変更があった場合のみ)。
