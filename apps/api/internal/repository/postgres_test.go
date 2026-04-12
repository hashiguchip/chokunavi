package repository_test

import (
	"context"
	"errors"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"testing"

	"github.com/jackc/pgx/v5"
	"github.com/testcontainers/testcontainers-go"
	tcpostgres "github.com/testcontainers/testcontainers-go/modules/postgres"

	"github.com/hashiguchip/chokunavi/apps/api/internal/repository"
)

// TestPostgresRepo_GetAppDataForUser は本物の Postgres コンテナに対し、
// migrations/ 配下の SQL を流し、raw SQL で投入したデータを GetAppDataForUser
// が期待どおり aggregate して返すことを検証する integration test。
//
// 前提:
//   - Docker daemon が動いていること
//   - apps/api/migrations/*.sql が存在すること (mise run ent:diff initial で生成済み)
func TestPostgresRepo_GetAppDataForUser(t *testing.T) {
	if testing.Short() {
		t.Skip("skip integration test in -short mode")
	}

	migrationFiles := loadMigrationFiles(t, "../../migrations")
	if len(migrationFiles) == 0 {
		t.Skip("no migration files in apps/api/migrations; run `mise run ent:diff initial` first")
	}

	ctx := context.Background()
	dsn := startPostgres(t, ctx, migrationFiles)

	client, _, closeFn, err := repository.OpenEntClient(ctx, dsn)
	if err != nil {
		t.Fatalf("OpenEntClient: %v", err)
	}
	t.Cleanup(closeFn)
	repo := repository.NewAppDataRepo(client)

	// fixture: pricings → users → projects を raw SQL で投入
	conn, err := pgx.Connect(ctx, dsn)
	if err != nil {
		t.Fatalf("pgx connect: %v", err)
	}
	defer conn.Close(ctx)

	stmts := []string{
		`INSERT INTO pricings (id, label, rate, billing_hours, trial_rate, trial_note) VALUES
			(1, 'standard', '1円/h', '実稼働', '1円/h', 'お試し')`,
		`INSERT INTO pricing_patterns (label, trial_flex, trial_period, regular_flex, regular_period, display_order, pricing_id) VALUES
			('パターンA', 0, '1ヶ月', 0, '2ヶ月目〜', 1, 1)`,
		`INSERT INTO users (id, label, code, created_at, pricing_id) VALUES
			(10, 'alice', 'alice-code', NOW(), 1)`,
		`INSERT INTO projects (id, title, period_start, period_end, team, role, summary, tech_ids, phase_ids, display_order) VALUES
			('p-newer', 'New Project', '2024-01-01', NULL,         '4名', 'PG', 'recent ongoing', '["go","react"]'::jsonb, '["design","development"]'::jsonb, 1),
			('p-older', 'Old Project', '2018-04-01', '2019-12-31', '3名', 'PG', 'past project',   '["go"]'::jsonb,         '["development"]'::jsonb,           2)`,
	}
	for _, s := range stmts {
		if _, err := conn.Exec(ctx, s); err != nil {
			t.Fatalf("seed insert: %v\nSQL: %s", err, s)
		}
	}

	got, err := repo.GetAppDataForUser(ctx, 10)
	if err != nil {
		t.Fatalf("GetAppDataForUser: %v", err)
	}

	if len(got.Projects) != 2 {
		t.Fatalf("expected 2 projects, got %d", len(got.Projects))
	}
	// display_order ASC で並ぶ
	if got.Projects[0].ID != "p-newer" || got.Projects[1].ID != "p-older" {
		t.Errorf("project order = [%s, %s], want [p-newer, p-older]", got.Projects[0].ID, got.Projects[1].ID)
	}
	if want := []string{"go", "react"}; !equalSorted(got.Projects[0].TechIDs, want) {
		t.Errorf("p-newer techIds = %v, want %v", got.Projects[0].TechIDs, want)
	}
	if want := []string{"design", "development"}; !equalSorted(got.Projects[0].PhaseIDs, want) {
		t.Errorf("p-newer phaseIds = %v, want %v", got.Projects[0].PhaseIDs, want)
	}
	if got.Projects[0].PeriodEnd != nil {
		t.Errorf("p-newer periodEnd should be nil (ongoing), got %v", got.Projects[0].PeriodEnd)
	}
	if got.Projects[1].PeriodEnd == nil {
		t.Errorf("p-older periodEnd should be set, got nil")
	}

	if got.Pricing == nil {
		t.Fatal("pricing should not be nil")
	}
	if got.Pricing.Rate != "1円/h" {
		t.Errorf("pricing.rate = %q, want %q", got.Pricing.Rate, "1円/h")
	}
	if len(got.Pricing.Patterns) != 1 || got.Pricing.Patterns[0].Label != "パターンA" {
		t.Errorf("pricing.patterns = %v", got.Pricing.Patterns)
	}

	// pricing_id が NULL のユーザーは pricing == nil を返す
	if _, err := conn.Exec(ctx,
		`INSERT INTO users (id, label, code, created_at) VALUES (11, 'bob', 'bob-code', NOW())`); err != nil {
		t.Fatalf("insert user without pricing: %v", err)
	}
	gotNoPricing, err := repo.GetAppDataForUser(ctx, 11)
	if err != nil {
		t.Fatalf("GetAppDataForUser (no pricing): %v", err)
	}
	if gotNoPricing.Pricing != nil {
		t.Errorf("expected pricing to be nil for user without pricing, got %+v", gotNoPricing.Pricing)
	}
}

// TestUserRepo_FindByCode は users テーブルに対する plaintext lookup の動作を検証する。
//
//   - 存在する code → User を返す
//   - 存在しない code → ErrUserNotFound
//   - revoked_at がセットされた code → ErrUserNotFound
func TestUserRepo_FindByCode(t *testing.T) {
	if testing.Short() {
		t.Skip("skip integration test in -short mode")
	}

	migrationFiles := loadMigrationFiles(t, "../../migrations")
	if len(migrationFiles) == 0 {
		t.Skip("no migration files in apps/api/migrations")
	}

	ctx := context.Background()
	dsn := startPostgres(t, ctx, migrationFiles)

	client, _, closeFn, err := repository.OpenEntClient(ctx, dsn)
	if err != nil {
		t.Fatalf("OpenEntClient: %v", err)
	}
	t.Cleanup(closeFn)
	repo := repository.NewUserRepo(client)

	conn, err := pgx.Connect(ctx, dsn)
	if err != nil {
		t.Fatalf("pgx connect: %v", err)
	}
	defer conn.Close(ctx)
	if _, err := conn.Exec(ctx, `INSERT INTO users (label, code, created_at) VALUES
		('alice', 'alice-code', NOW()),
		('bob',   'bob-code',   NOW())`); err != nil {
		t.Fatalf("insert users: %v", err)
	}
	if _, err := conn.Exec(ctx, `INSERT INTO users (label, code, created_at, revoked_at) VALUES
		('carol', 'carol-code', NOW(), NOW())`); err != nil {
		t.Fatalf("insert revoked user: %v", err)
	}

	t.Run("valid code returns user", func(t *testing.T) {
		u, err := repo.FindByCode(ctx, "alice-code")
		if err != nil {
			t.Fatalf("FindByCode: %v", err)
		}
		if u.Label != "alice" || u.Code != "alice-code" {
			t.Errorf("got %+v", u)
		}
	})

	t.Run("unknown code returns ErrUserNotFound", func(t *testing.T) {
		if _, err := repo.FindByCode(ctx, "no-such-code"); !errors.Is(err, repository.ErrUserNotFound) {
			t.Errorf("expected ErrUserNotFound, got %v", err)
		}
	})

	t.Run("revoked user is excluded", func(t *testing.T) {
		if _, err := repo.FindByCode(ctx, "carol-code"); !errors.Is(err, repository.ErrUserNotFound) {
			t.Errorf("expected ErrUserNotFound for revoked user, got %v", err)
		}
	})
}

// startPostgres は testcontainers-go で Postgres を起動し、migration を流して dsn を返す。
func startPostgres(t *testing.T, ctx context.Context, migrationFiles []string) string {
	t.Helper()
	container, err := tcpostgres.Run(ctx,
		"postgres:17-alpine",
		tcpostgres.WithDatabase("app_data_test"),
		tcpostgres.WithUsername("test"),
		tcpostgres.WithPassword("test"),
		tcpostgres.BasicWaitStrategies(),
	)
	if err != nil {
		t.Fatalf("start postgres container: %v", err)
	}
	t.Cleanup(func() {
		if err := testcontainers.TerminateContainer(container); err != nil {
			t.Logf("terminate container: %v", err)
		}
	})

	dsn, err := container.ConnectionString(ctx, "sslmode=disable")
	if err != nil {
		t.Fatalf("get connection string: %v", err)
	}
	applyMigrations(t, ctx, dsn, migrationFiles)
	return dsn
}

// loadMigrationFiles は migrations/ 配下の .sql ファイルを名前順 (= timestamp 順) に返す。
func loadMigrationFiles(t *testing.T, dir string) []string {
	t.Helper()
	entries, err := os.ReadDir(dir)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		t.Fatalf("read migration dir: %v", err)
	}
	var files []string
	for _, e := range entries {
		if e.IsDir() {
			continue
		}
		if !strings.HasSuffix(e.Name(), ".sql") {
			continue
		}
		files = append(files, filepath.Join(dir, e.Name()))
	}
	sort.Strings(files)
	return files
}

// applyMigrations は raw pgx 接続で SQL ファイルを順次 execute する。
func applyMigrations(t *testing.T, ctx context.Context, dsn string, files []string) {
	t.Helper()
	conn, err := pgx.Connect(ctx, dsn)
	if err != nil {
		t.Fatalf("pgx connect: %v", err)
	}
	defer conn.Close(ctx)

	for _, f := range files {
		body, err := os.ReadFile(f)
		if err != nil {
			t.Fatalf("read %s: %v", f, err)
		}
		if _, err := conn.Exec(ctx, string(body)); err != nil {
			t.Fatalf("apply %s: %v", filepath.Base(f), err)
		}
	}
}

// equalSorted は順序を無視した string slice の等価比較。
func equalSorted(a, b []string) bool {
	if len(a) != len(b) {
		return false
	}
	a2 := append([]string(nil), a...)
	b2 := append([]string(nil), b...)
	sort.Strings(a2)
	sort.Strings(b2)
	for i := range a2 {
		if a2[i] != b2[i] {
			return false
		}
	}
	return true
}
