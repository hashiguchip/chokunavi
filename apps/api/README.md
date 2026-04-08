# apps/api

`apps/web` が叩くデータ API。今は土台だけ。

> モノレポ全体の概要は [ルート README](../../README.md) を参照。

## Stack

- Go 1.25
- [huma v2](https://huma.rocks/)

## Endpoints

| Method | Path | 用途 |
| --- | --- | --- |
| `GET` | `/healthz` | liveness probe (`{"status":"ok"}`) |

## Commands

| 用途 | mise (ルートから) | make (apps/api から) |
| --- | --- | --- |
| dev server | `mise run dev:api` | `make dev` |
| vet + test | `mise run test:api` | `make test` |
| build | — | `make build` |

## Environment Variables

| 変数 | 必須 | 説明 |
| --- | --- | --- |
| `PORT` | 任意 | 待受ポート (default `8080`) |
