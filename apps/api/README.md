# apps/api

`apps/web` が叩くデータ API。

> モノレポ全体の概要は [ルート README](../../README.md) を参照。

## Stack

- Go 1.25 / [huma v2](https://huma.rocks/)
- [ent](https://entgo.io/) + Postgres (pgxpool) + [Atlas](https://atlasgo.io/) versioned migrations
- [SOPS](https://getsops.io/) + [age](https://github.com/FiloSottile/age) で seed データを暗号化

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
| seed 投入 | `mise run seed:apply` (詳細は下の Seed セクション) |

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

個人情報を含む `apps/api/seed/portfolio.yaml` は **SOPS + age** で暗号化して repo に commit する。
復号鍵 (age private key) は橋口の dev machine だけが持つので、GitHub 上では中身を読めない。

構造は `apps/api/seed/portfolio.yaml.example` (平文 / commit 済み) を参照。

#### 初回 setup (新しい dev machine)

```sh
# 1. age key pair を生成
mkdir -p ~/.config/age
age-keygen -o ~/.config/age/resume_2026.key
# → 標準出力に "Public key: age1xxxxxxxxx..." が出る

# 2. .sops.yaml の age recipient を public key で置き換える
#    (リポジトリルート /.sops.yaml の TODO 行)

# 3. SOPS が key を見つけられるよう env に export しておく
#    (~/.zshrc などに追加)
export SOPS_AGE_KEY_FILE=~/.config/age/resume_2026.key

# 4. private key をバックアップ (1Password など)。失うと復号不能。
```

#### 編集

```sh
sops apps/api/seed/portfolio.yaml
# → 透過 decrypt → エディタで編集 → 保存時に自動 encrypt
```

新しい seed ファイルを 0 から作る場合:
```sh
cp apps/api/seed/portfolio.yaml.example apps/api/seed/portfolio.yaml
sops -e -i apps/api/seed/portfolio.yaml   # in-place encrypt
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

private key を失うと暗号化された YAML は復号できない。復旧手順:

1. 新しい age key pair を生成
2. `.sops.yaml` を新しい public key に書き換え
3. `apps/api/seed/portfolio.yaml` を `.example` から再作成し、手で実データを埋め直す
4. `sops -e -i` で再暗号化

`sops updatekeys` での key rotation は、古い key で復号できる状態でしか実行できない
ので、完全に失った場合は再作成が必要。
