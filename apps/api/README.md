# apps/api

`apps/web` が叩くデータ API。

> モノレポ全体の概要は [ルート README](../../README.md) を参照。

## Stack

- Go 1.25 / [huma v2](https://huma.rocks/)
- [ent](https://entgo.io/) + PostgreSQL 17 ([pgx/v5](https://github.com/jackc/pgx)) + [Atlas](https://atlasgo.io/) versioned migrations
- [SOPS](https://getsops.io/) binary mode + [age](https://github.com/FiloSottile/age) で seed データを暗号化

## Endpoints

| Method | Path | 用途 |
| --- | --- | --- |
| `GET` | `/healthz` | liveness probe |
| `GET` | `/api/app-data` | 認証 user に紐づく projects + pricing (`X-Referral-Code` 必須) |

## Local setup

```sh
# 1. 依存サービスを起動 (Postgres 17)
docker compose up -d postgres

# 2. migration を適用
DATABASE_URL=postgres://postgres:postgres@localhost:5432/resume_2026?sslmode=disable \
  mise run migrate:up

# 3. seed を投入 (referral code を含む users もここで入る)
DATABASE_URL=postgres://postgres:postgres@localhost:5432/resume_2026?sslmode=disable \
  mise run seed:apply

# 4. dev server 起動
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
| seed 投入 | `mise run seed:apply` (詳細は下の Seed セクション) |
| OpenAPI spec 生成 | `mise run codegen:api` (→ `openapi.yaml`) |
| OpenAPI → TS schema 一括 | `mise run codegen` (`codegen:api` + `codegen:web`) |

## Environment Variables

| 変数 | 必須 | 説明 |
| --- | --- | --- |
| `PORT` | 任意 | 待受ポート (default `8080`) |
| `DATABASE_URL` | **必須** | Postgres DSN (e.g. `postgres://user:pass@host/db?sslmode=...`) |
| `CORS_ORIGINS` | 任意 | カンマ区切りの許可 origin (default `https://hashiguchip.github.io`) |

## Authentication

`/api/app-data` は `X-Referral-Code` header を必須とする。コード (= ユーザー) は
`users` テーブルに **plaintext で** 格納される。

- ハッシュ化はしない。本サイトの脅威モデル (チョクナビ閲覧 gate) では plaintext で
  十分と判断した。流出シナリオの最悪は単価情報が見える程度で、operator が許容済み。
- リポジトリ at-rest は `apps/api/seed/app-data.sops.bin` を SOPS binary mode + age で
  暗号化することで保護する (下の Seed セクション参照)。
- middleware は `users.code = $1 AND revoked_at IS NULL` で lookup する。一致した
  ユーザーは request context に格納される (`middleware.UserFromContext`)。
- 各 user は `pricings` の 1 行に紐づく (N:1)。`/api/app-data` は context から
  user を取り出し、その user の pricing と全 projects を返す。

サンプル seed (`apps/api/seed/app-data.yaml.example`) には固定の `proto` user
(referral code `proto`) が含まれており、開発者の手元動作確認に使う。

### ユーザー追加 / revoke

```sh
sops --input-type binary --output-type binary apps/api/seed/app-data.sops.bin
# users: セクションに新しい label / code を追加 (revoke なら revoked_at を設定)
mise run seed:apply
```

`cmd/seed` は単一 transaction で全テーブルを delete → insert する idempotent 投入なので、
seed YAML が DB の単一 source of truth になる。

## OpenAPI

`openapi.yaml` を huma operations から自動生成しリポジトリに commit する (contract-first)。
PR diff で API 変更を可視化でき、同ファイルを `openapi-typescript` に通して
`apps/web/src/services/api/schema.generated.ts` を生成する。

```sh
mise run codegen        # openapi.yaml 生成 → TS schema 生成 (一括)
```

## Schema / migrations

- `ent/schema/*.go` が schema の single source of truth。変更後は `mise run ent:generate` で client を再生成。
- `mise run ent:diff <name>` で差分 SQL を `migrations/` に書き出す (atlas 互換フォーマット、`atlas.sum` 付き)。
- `mise run migrate:up` は atlas CLI を使って `migrations/` を `DATABASE_URL` に流す。

### Seed データ

個人情報を含む seed は `apps/api/seed/app-data.sops.bin` として **SOPS binary mode + age** で
暗号化して repo に commit する。binary mode はファイル全体を単一の暗号化 blob にするため、
キー名・配列長などの構造メタデータも一切漏れない。
復号鍵 (age private key) は開発者の dev machine だけが持つので、GitHub 上では中身を読めない。

構造は `apps/api/seed/app-data.yaml.example` (平文 / commit 済み) を参照。

#### 初回 setup (新しい dev machine)

```sh
# 1. age key pair を生成
mkdir -p ~/.config/age
age-keygen -o ~/.config/age/resume_2026.key
# → 標準出力に "Public key: age1xxxxxxxxx..." が出る

# 2. .sops.yaml の age recipient を public key で置き換える
#    (リポジトリルート /.sops.yaml)

# 3. SOPS が key を見つけられるよう env に export しておく
#    (~/.zshrc などに追加)
export SOPS_AGE_KEY_FILE=~/.config/age/resume_2026.key

# 4. private key をバックアップ (1Password など)。失うと復号不能。
```

#### 編集

```sh
sops --input-type binary --output-type binary apps/api/seed/app-data.sops.bin
# → 透過 decrypt → エディタで YAML を編集 → 保存時に自動 encrypt
```

新しい seed ファイルを 0 から作る場合:
```sh
# .example を元に平文 YAML を用意し、binary mode で暗号化
cp apps/api/seed/app-data.yaml.example /tmp/app-data.yaml
# /tmp/app-data.yaml を手で実データに書き換えてから:
sops -e --input-type binary \
  --age age1lz72v9y6qkhuy72te5q30jp05n88l0z7yp8m6vgt4nf7d0fg94tqr89rdy \
  /tmp/app-data.yaml > apps/api/seed/app-data.sops.bin
rm /tmp/app-data.yaml
```

#### 投入

```sh
# ローカル DB
DATABASE_URL=postgres://postgres:postgres@localhost:5432/resume_2026?sslmode=disable \
  mise run seed:apply

# 本番 (leapcell)
DATABASE_URL=<leapcell-postgres-dsn> mise run seed:apply
```

`cmd/seed` は idempotent: 1 つの transaction で全テーブルを delete → insert する。
途中で失敗すれば全てロールバックされ、DB は元の状態に戻る。

#### key を失った場合

private key を失うと暗号化されたファイルは復号できない。復旧手順:

1. 新しい age key pair を生成
2. `.sops.yaml` を新しい public key に書き換え
3. `.example` から平文 YAML を再作成し、手で実データを埋め直す
4. `sops -e --input-type binary --age <public-key> plain.yaml > app-data.sops.bin` で暗号化

`sops updatekeys` での key rotation は、古い key で復号できる状態でしか実行できない
ので、完全に失った場合は再作成が必要。
