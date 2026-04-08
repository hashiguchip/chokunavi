// Command migrate は ent schema から versioned migration ファイルを生成する。
//
// 使い方:
//
//	go run ./cmd/migrate <migration_name>
//
// 事前条件:
//   - docker compose の postgres サービスが起動している
//   - postgres 内に migration_shadow データベースが空の状態で存在する
//     (mise run ent:diff タスクが drop & create を行う)
//
// 内部動作:
//  1. MIGRATION_DEV_URL に接続 (空の shadow DB を期待)
//  2. apps/api/migrations の既存ファイルを replay して current state を再構築
//  3. ent の Tables (現 schema) と diff を取り、新規 SQL ファイルを書き出す
//
// 出力先は apps/api/migrations。atlas migrate apply で適用可能な形式 (atlas.sum 付き)。
package main

import (
	"context"
	"database/sql"
	"errors"
	"log/slog"
	"os"

	atlas "ariga.io/atlas/sql/migrate"
	"entgo.io/ent/dialect"
	"entgo.io/ent/dialect/sql/schema"
	"github.com/jackc/pgx/v5/stdlib"

	"github.com/hashiguchip/resume_2026/apps/api/ent/migrate"
)

// ent 側の NamedDiff は database/sql.Open("postgres", ...) で driver lookup
// するため、pgx の stdlib を "postgres" 名で登録しておく必要がある
// (stdlib は init で "pgx" 名で自動登録するが "postgres" は登録しない)。
func init() {
	sql.Register("postgres", stdlib.GetDefaultDriver())
}

const (
	defaultDevURL    = "postgres://postgres:postgres@localhost:5432/migration_shadow?sslmode=disable"
	migrationDirPath = "migrations"
)

func main() {
	if len(os.Args) != 2 {
		slog.Error("usage: migrate <migration_name>")
		os.Exit(1)
	}
	name := os.Args[1]

	devURL := os.Getenv("MIGRATION_DEV_URL")
	if devURL == "" {
		devURL = defaultDevURL
	}

	ctx := context.Background()
	if err := os.MkdirAll(migrationDirPath, 0o755); err != nil {
		slog.Error("create migration dir", "path", migrationDirPath, "err", err)
		os.Exit(1)
	}
	dir, err := atlas.NewLocalDir(migrationDirPath)
	if err != nil {
		slog.Error("open migration dir", "path", migrationDirPath, "err", err)
		os.Exit(1)
	}

	opts := []schema.MigrateOption{
		schema.WithDir(dir),
		schema.WithMigrationMode(schema.ModeReplay),
		schema.WithDialect(dialect.Postgres),
		schema.WithFormatter(atlas.DefaultFormatter),
	}

	if err := migrate.NamedDiff(ctx, devURL, name, opts...); err != nil {
		if errors.Is(err, atlas.ErrNoPlan) {
			slog.Info("no schema changes detected", "name", name)
			return
		}
		slog.Error("generate migration", "err", err)
		os.Exit(1)
	}
	slog.Info("migration generated", "name", name, "dir", migrationDirPath)
}
