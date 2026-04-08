# apps/api

`apps/web` が叩くデータ API。

> モノレポ全体の概要は [ルート README](../../README.md) を参照。

## Stack

- Go 1.25 / [huma v2](https://huma.rocks/)
- [ent](https://entgo.io/) + Postgres (pgxpool) + [Atlas](https://atlasgo.io/) versioned migrations

## Endpoints

| Method | Path | 用途 |
| --- | --- | --- |
| `GET` | `/healthz` | liveness probe |
| `GET` | `/api/portfolio` | aggregate portfolio (`X-Referral-Code` 必須) |

## Local setup

```sh
# 1. 依存サービスを起動 (Postgres 17)
docker compose up -d postgres

# 2. 初回のみ: ent schema から initial migration を生成
mise run ent:diff initial

# 3. migration を適用
DATABASE_URL=postgres://postgres:postgres@localhost:5432/resume_2026?sslmode=disable \
  mise run migrate:up

# 4. dev server 起動
AUTH_CODE_HASHES=<your-sha256-hash> \
DATABASE_URL=postgres://postgres:postgres@localhost:5432/resume_2026?sslmode=disable \
  mise run dev:api
```

## Commands

| 用途 | mise (ルートから) |
| --- | --- |
| dev server | `mise run dev:api` |
| vet + test | `mise run test:api` (Docker daemon が必要) |
| ent client 再生成 | `mise run ent:generate` |
| migration 生成 | `mise run ent:diff <name>` |
| migration 適用 | `mise run migrate:up` |

## Environment Variables

| 変数 | 必須 | 説明 |
| --- | --- | --- |
| `PORT` | 任意 | 待受ポート (default `8080`) |
| `DATABASE_URL` | **必須** | Postgres DSN (e.g. `postgres://user:pass@host/db?sslmode=...`) |
| `AUTH_CODE_HASHES` | **必須** | カンマ区切りの SHA-256 hash。`echo -n "コード" \| shasum -a 256` で生成 |
| `CORS_ORIGINS` | 任意 | カンマ区切りの許可 origin (default `https://hashiguchip.github.io`) |

## Schema / migrations

- `ent/schema/*.go` が schema の single source of truth。変更後は `mise run ent:generate` で client を再生成。
- `mise run ent:diff <name>` で差分 SQL を `migrations/` に書き出す (atlas 互換フォーマット、`atlas.sum` 付き)。
- `mise run migrate:up` は atlas CLI を使って `migrations/` を `DATABASE_URL` に流す。

### Seed データ

個人情報を含むため、seed (実データ) は git に commit しない。投入手段は別途検討中。
