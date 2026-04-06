# apps/api — Data API

Web (`apps/web`) 向けの汎用データ API。フロントにベタ書きしていた表示データを段階的にこちらへ移し、データ更新時にコードを触らずに済む構成を目指す。

> モノレポ全体の概要・横断ツール・セットアップは [ルート README](../../README.md) を参照。

## Tech Stack

- **Language**: Go 1.24
- **HTTP**: 標準ライブラリ `net/http` のみ (フレームワーク不使用)
- **Logging**: `log/slog`
- **Auth**: SHA-256 ハッシュ照合 (`crypto/subtle` で定数時間比較)

## Directory

```
apps/api/
├── main.go           # サーバー本体 (handler, auth, CORS)
├── main_test.go      # テスト
├── go.mod
├── Makefile
├── Dockerfile        # multi-stage (debian + mise → debian dev → distroless production)
└── .env.example
```

## Commands

単独で api を起動するためのコマンド群。**フルスタック開発 (web から呼び出す) では `docker compose up` を推奨** ([ルート README の Run セクション](../../README.md#run) を参照)。ルートから `mise run` でも `apps/api/` 内で `make` 直接でも可。

| 用途           | mise (ルートから)    | make (apps/api から) |
| -------------- | -------------------- | -------------------- |
| 開発サーバー   | `mise run dev:api`   | `make dev`           |
| Lint + Test    | `mise run test:api`  | `make test`          |
| 本番ビルド     | —                    | `make build`         |

`make build` は CGO を無効化したスタティックバイナリを `bin/server` に出力する (`-ldflags="-s -w"` で stripped)。

## Environment Variables

`.env.example` をコピーして `.env` を作る:

```sh
cp .env.example .env
```

| 変数 | 必須 | 説明 |
| ---- | ---- | ---- |
| `PORT` | 任意 | 待受ポート (デフォルト `8080`) |
| `CORS_ORIGINS` | 任意 | カンマ区切りの許可 Origin (デフォルト `https://hashiguchip.github.io`) |
| `AUTH_CODE_HASHES` | ✅ | 許可コードの SHA-256 ハッシュ (カンマ区切り)。1 件以上必須。`.env.example` の値はプレースホルダなので必ず実ハッシュに差し替える |
| `PRICING_JSON` | ✅ | 返却する料金 JSON 文字列。**シングルクォートで囲む** (shell の `source` で波括弧が壊れるため) |

許可コードのハッシュは次のように生成する:

```sh
echo -n "あなたのコード" | shasum -a 256
```

## Authentication

クライアントは `X-Referral-Code` ヘッダにコード文字列をそのまま入れて送る。サーバー側で SHA-256 化し、`AUTH_CODE_HASHES` のいずれかと一致すれば認証成功。比較は [`crypto/subtle.ConstantTimeCompare`](https://pkg.go.dev/crypto/subtle#ConstantTimeCompare) でタイミング攻撃を回避している。

## Endpoints

| Method | Path           | 用途 |
| ------ | -------------- | ---- |
| `GET`     | `/healthz`     | ヘルスチェック (`{"status":"ok"}`) |
| `OPTIONS` | `/api/pricing` | CORS preflight |
| `GET`     | `/api/pricing` | 認証成功時に `PRICING_JSON` をそのまま返却 |

CORS は `CORS_ORIGINS` に列挙された Origin にのみ `Access-Control-Allow-*` を返す。許可ヘッダは `X-Referral-Code, Content-Type`、メソッドは `GET, OPTIONS`。

```sh
# 動作確認例
curl -H "X-Referral-Code: あなたのコード" http://localhost:8080/api/pricing
```

## Docker

ルート [`docker-compose.yml`](../../docker-compose.yml) の `api` サービスから参照される (フルスタック開発時の推奨パス)。multi-stage 構成:

- **build** (`debian:13-slim` + mise): ルートの [`.mise.toml`](../../.mise.toml) から Go のバージョンを解決して install (host と完全一致、参考: [mise + Docker cookbook](https://mise.jdx.dev/mise-cookbook/docker.html))。`CGO_ENABLED=0` で完全 static binary を生成
- **dev** (`debian:13-slim` + バイナリのみ): compose の `target: dev` 経由で起動
- **production** (`gcr.io/distroless/static-debian12`): デフォルト target、Fly.io デプロイ用 — イメージサイズは旧構成と同等

ビルドコンテキストはリポジトリルート (`context: .`) で、ルート [`.dockerignore`](../../.dockerignore) が build 対象を絞っている。

## Deploy

[`deploy-api.yml`](../../.github/workflows/deploy-api.yml) が `main` への push を契機に走り、`go vet` / `go test` / `go build` で検証する。Fly.io への実デプロイ部分は `fly launch` 完了後にコメント解除して有効化する想定。
