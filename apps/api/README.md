# apps/api

`apps/web` が叩くデータ API。

> モノレポ全体の概要は [ルート README](../../README.md) を参照。

## Stack

- Go 1.25 / [huma v2](https://huma.rocks/)
- SOPS binary mode + age で暗号化した seed YAML を起動時に memory store へ読み込む

## Endpoints

| Method | Path | 用途 |
| --- | --- | --- |
| `GET` | `/healthz` | liveness probe |
| `GET` | `/api/app-data` | 認証 user に紐づく projects + pricing (`X-Referral-Code` 必須) |

## Local setup

```sh
# SOPS seed を復号して dev server 起動
mise run dev:api
```

`dev:api` は `apps/api/seed/app-data.sops.bin` を復号し、`APP_DATA_YAML_B64`
を process env に入れて起動する。Docker Compose や deploy 先で使う `.env` / secret
を作る場合は `mise run app-data:env >> apps/api/.env` を使う。

## Commands

| 用途 | mise (ルートから) |
| --- | --- |
| dev server | `mise run dev:api` |
| vet + test | `mise run test:api` |
| APP_DATA_YAML_B64 生成 | `mise run app-data:env` |
| OpenAPI spec 生成 | `mise run codegen:api` (→ `openapi.yaml`) |
| OpenAPI → TS schema 一括 | `mise run codegen` (`codegen:api` + `codegen:web`) |

## Environment Variables

| 変数 | 必須 | 説明 |
| --- | --- | --- |
| `PORT` | 任意 | 待受ポート (default `8080`) |
| `APP_DATA_YAML_B64` | **必須** | SOPS 復号済み seed YAML を base64 化した値 |
| `CORS_ORIGINS` | 任意 | カンマ区切りの許可 origin (default `https://hashiguchip.github.io`) |

## Authentication

`/api/app-data` は `X-Referral-Code` header を必須とする。コード (= ユーザー) は
seed YAML の `users` セクションに **plaintext で** 格納され、API 起動時に memory
index (`code -> user`) へ展開される。

- ハッシュ化はしない。本サイトの脅威モデル (チョクナビ閲覧 gate) では plaintext で
  十分と判断した。流出シナリオの最悪は単価情報が見える程度で、operator が許容済み。
- リポジトリ at-rest は `apps/api/seed/app-data.sops.bin` を SOPS binary mode + age で
  暗号化することで保護する (下の Seed セクション参照)。
- middleware は memory index から `code` を lookup し、`revoked_at` があれば 401 にする。一致した
  ユーザーは request context に格納される (`middleware.UserFromContext`)。
- 各 user は `pricings` の 1 行に紐づく。`/api/app-data` は context から
  user を取り出し、その user の pricing と全 projects を返す。

サンプル seed (`apps/api/seed/app-data.yaml.example`) には固定の `proto` user
(referral code `proto`) が含まれており、開発者の手元動作確認に使う。

### ユーザー追加 / revoke

```sh
sops --input-type binary --output-type binary apps/api/seed/app-data.sops.bin
# users: セクションに新しい label / code を追加 (revoke なら revoked_at を設定)
mise run app-data:env
```

seed YAML が API data の single source of truth になる。deploy 先では
`APP_DATA_YAML_B64` secret を更新して再デプロイする。

## OpenAPI

`openapi.yaml` を huma operations から自動生成しリポジトリに commit する (contract-first)。
PR diff で API 変更を可視化でき、同ファイルを `openapi-typescript` に通して
`apps/web/src/services/api/schema.generated.ts` を生成する。

```sh
mise run codegen        # openapi.yaml 生成 → TS schema 生成 (一括)
```

## Deploy

API は Cloud Run へ deploy する。現状は移行優先のため手動 deploy を暫定運用し、
後で GitHub Actions からの自動 deploy に置き換える。

公開READMEには project ID や実際の service URL は固定値として書かず、
必要な値はローカル shell 変数で渡す。

```sh
PROJECT_ID="<gcp-project-id>"
REGION="asia-northeast1"
REPOSITORY="chokunavi"
SERVICE="chokunavi-api"
IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/api:latest"
```

初回のみ Artifact Registry repository を作成する。

```sh
gcloud artifacts repositories create "${REPOSITORY}" \
  --repository-format=docker \
  --location="${REGION}"

gcloud auth configure-docker "${REGION}-docker.pkg.dev"
```

Apple Silicon から Cloud Run 向けに build する場合は `linux/amd64` を明示する。

```sh
docker buildx build \
  --platform linux/amd64 \
  -f apps/api/Dockerfile \
  -t "${IMAGE}" \
  --push \
  .
```

deploy 時は復号済み seed を base64 化した値を環境変数として渡す。
`APP_DATA_YAML_B64` は base64 だが復元可能なので、ログやREADMEには貼らない。

```sh
APP_DATA_YAML_B64="$(mise run app-data:env | tail -n 1 | sed 's/^APP_DATA_YAML_B64=//')"

gcloud run deploy "${SERVICE}" \
  --image "${IMAGE}" \
  --region "${REGION}" \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 1 \
  --set-env-vars CORS_ORIGINS=https://hashiguchip.github.io \
  --set-env-vars APP_DATA_YAML_B64="${APP_DATA_YAML_B64}"
```

deploy 後は `/api/app-data` が referral code なしで `401`、有効な
`X-Referral-Code` 付きで `200` になることを確認する。

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
age-keygen -o ~/.config/age/chokunavi.key
# → 標準出力に "Public key: age1xxxxxxxxx..." が出る

# 2. .sops.yaml の age recipient を public key で置き換える
#    (リポジトリルート /.sops.yaml)

# 3. SOPS が key を見つけられるよう env に export しておく
#    (~/.zshrc などに追加)
export SOPS_AGE_KEY_FILE=~/.config/age/chokunavi.key

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

#### APP_DATA_YAML_B64 生成

```sh
mise run app-data:env
```

出力された `APP_DATA_YAML_B64=...` を `apps/api/.env` または deploy 先の secret/env
に設定する。API は起動時にこの値を decode → YAML parse → memory store 構築する。

#### key を失った場合

private key を失うと暗号化されたファイルは復号できない。復旧手順:

1. 新しい age key pair を生成
2. `.sops.yaml` を新しい public key に書き換え
3. `.example` から平文 YAML を再作成し、手で実データを埋め直す
4. `sops -e --input-type binary --age <public-key> plain.yaml > app-data.sops.bin` で暗号化

`sops updatekeys` での key rotation は、古い key で復号できる状態でしか実行できない
ので、完全に失った場合は再作成が必要。
