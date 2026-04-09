# change jobs 2026

> **Live**: <https://hashiguchip.github.io/resume_2026/>

[![CI](https://github.com/hashiguchip/resume_2026/actions/workflows/ci.yml/badge.svg)](https://github.com/hashiguchip/resume_2026/actions/workflows/ci.yml)
[![Deploy Web](https://github.com/hashiguchip/resume_2026/actions/workflows/deploy-web.yml/badge.svg)](https://github.com/hashiguchip/resume_2026/actions/workflows/deploy-web.yml)
[![Deploy API](https://github.com/hashiguchip/resume_2026/actions/workflows/deploy-api.yml/badge.svg)](https://github.com/hashiguchip/resume_2026/actions/workflows/deploy-api.yml)

求人票形式のポートフォリオサイト。`mise` で統合管理するモノレポ構成。

## Apps

- [**apps/web**](apps/web/README.md) — フロントエンド。GitHub Pages にて公開
- [**apps/api**](apps/api/README.md) — データ API (Fly.io デプロイ準備中)。フロントにベタ書きされている表示データを段階的に API 経由へ移行し、データ更新のたびにコードを触らなくて済む構成を目指す

## Monorepo Structure

```
.
├── apps/
│   ├── web/                # フロントエンド
│   └── api/                # データ API
├── .mise.toml              # ツールバージョン + タスク定義
├── biome.json              # Lint/Format (リポジトリ全体)
├── hk.pkl                  # Git hooks (pre-commit / commit-msg)
├── cog.toml                # Conventional Commits 設定
├── docker-compose.yml      # ローカル開発用 (web + api)
└── CLAUDE.md               # Claude Code 向けガイド
```

## Requirements

[mise](https://mise.jdx.dev/) のみ。Node / Go / Biome / hk / cocogitto / pkl は `.mise.toml` で固定されており `mise install` で一括導入できる。

## Setup

```sh
# 1. ホストツール一式をインストール (Node / Go / Biome / hk / cocogitto / pkl)
mise install

# 2. Web 依存関係をインストール (host で lint / test / typecheck を走らせる場合)
cd apps/web && npm ci && cd ../..

# 3. 環境変数ファイルを用意
cp apps/web/.env.example apps/web/.env
cp apps/api/.env.example apps/api/.env
# ⚠ コピー後、必ず実値を埋めること:
#   - apps/web/.env: NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY (例ファイルに含まれていない、env.ts で必須)
#   - apps/api/.env: AUTH_CODE_HASHES (例ファイルはプレースホルダ)
```

ここまでが共通の前準備。実際の起動方法は次の `## Run` を参照。

## Run

開発時の起動方法は 2 通り。**フルスタック (web ↔ api 両方触る) 開発は Docker Compose を推奨**。
個別アプリだけ触る場合は mise の方が速い。

### Docker Compose (推奨: フルスタック開発)

```sh
docker compose up
```

- `web` (3000) と `api` (8080) を同時起動
- web は `NEXT_PUBLIC_DATA_API_URL=http://localhost:8080/api/pricing` を **自動で受け取る** (compose の `environment:` で注入済) ので `.env` への手書き不要
- `apps/web/src` を bind mount してホットリロード (`next.config.ts` 等の設定ファイルは反映されないので変更時は再起動)
- 個別の `apps/web/.env` / `apps/api/.env` はあれば自動読み込み (`env.ts` / `main.go` の必須項目は事前に埋めておくこと)
- **コンテナ内の Node / Go バージョンは host と同じ [`.mise.toml`](.mise.toml) から解決される** — Dockerfile は `debian:13-slim` をベースに mise を組み込み、`mise install` で `.mise.toml` を読む単一情報源パターン (参考: [mise + Docker cookbook](https://mise.jdx.dev/mise-cookbook/docker.html))
- 初回 build は数分かかる (mise が Node / Go を新規ダウンロード)。2 回目以降はレイヤキャッシュで速い

### mise (単一アプリ集中作業)

別ターミナルで:

```sh
mise run dev       # web → http://localhost:3000
mise run dev:api   # api → http://localhost:8080
```

- ホストの Node / Go (mise 管理) を直接使うので Docker オーバーヘッドなし
- web から api を呼ぶ場合は `apps/web/.env` に `NEXT_PUBLIC_DATA_API_URL=http://localhost:8080/api/pricing` を **手動で**設定する必要あり (compose 経由と違い自動セットされない)

## Branching

[GitHub Flow](https://docs.github.com/en/get-started/using-github/github-flow) ベースの trunk-based 運用。`main` を常に deployable に保ち、短命 feature branch + PR + squash merge で main に集約する。詳細は [`CLAUDE.md`](CLAUDE.md#branching) を参照。

## Commit Convention

Conventional Commits ([cocogitto](https://docs.cocogitto.io/) で検証)。

```
<type>(<scope>): <description>
```

`type` 一覧と changelog 反映可否は [`CLAUDE.md`](CLAUDE.md#commit-message-conventional-commits) を参照。コミットメッセージは英語。

## CI/CD

| Workflow | トリガ | 内容 |
| -------- | ------ | ---- |
| [`ci.yml`](.github/workflows/ci.yml) | PR (→ main) | web: `biome check` / `typecheck` / `test` / `build`、api: `go vet` / `go test` |
| [`deploy-web.yml`](.github/workflows/deploy-web.yml) | `main` push (`apps/web/**`) | 静的ビルドして GitHub Pages へデプロイ |
| [`deploy-api.yml`](.github/workflows/deploy-api.yml) | `main` push (`apps/api/**`) | ビルド検証 (Fly.io デプロイは `fly launch` 後に有効化予定) |

## Stack

### Web (`apps/web`)

- **Framework**: Next.js 16 (App Router) + React 19
- **Language**: TypeScript 5 (strict)
- **Styling**: Tailwind CSS 4
- **State**: Zustand 5
- **Forms / Validation**: react-hook-form 7 + Zod 4
- **Env**: `@t3-oss/env-nextjs` (Zod スキーマで型安全に検証)
- **Test**: Vitest 4
- **Icons**: lucide-react
- **Utils**: clsx

### API (`apps/api`)

- **Language**: Go 1.24
- **HTTP**: 標準ライブラリ `net/http` のみ (フレームワーク不使用)
- **Logging**: `log/slog`
- **Auth**: SHA-256 ハッシュ照合 + `crypto/subtle` (定数時間比較)

### Toolchain

- **Tool versions**: [mise](https://mise.jdx.dev/) — `.mise.toml` をホスト/コンテナ共通の Single Source of Truth として運用 (cookbook 方式)
- **Container**: Docker + Docker Compose — フルスタック開発の推奨パス、Dockerfile は `debian:13-slim` ベースで mise を組み込み
- **Lint / Format**: [Biome 2](https://biomejs.dev/) — ルート `biome.json` で JS/TS/JSON/CSS を一括管理
- **Git hooks**: [hk](https://hk.jdx.dev/) (pre-commit で Biome 自動修正) + [cocogitto](https://docs.cocogitto.io/) (commit-msg で Conventional Commits 検証)

各アプリの詳細なコマンド・環境変数・デプロイは個別の README を参照。

## License

[MIT](LICENSE)
