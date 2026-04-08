package repository_test

import (
	"context"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"testing"

	"github.com/jackc/pgx/v5"
	"github.com/testcontainers/testcontainers-go"
	tcpostgres "github.com/testcontainers/testcontainers-go/modules/postgres"

	"github.com/hashiguchip/resume_2026/apps/api/internal/repository"
)

// TestPostgresRepo_GetPortfolio は本物の Postgres コンテナに対し、
// migrations/ 配下の SQL を流し、ent client で挿入したデータを GetPortfolio が
// 期待どおり aggregate して返すことを検証する integration test。
//
// 前提:
//   - Docker daemon が動いていること
//   - apps/api/migrations/*.sql が存在すること (mise run ent:diff initial で生成済み)
//
// migrations が無い状態では skip する (CI で migration 未生成時のために)。
func TestPostgresRepo_GetPortfolio(t *testing.T) {
	if testing.Short() {
		t.Skip("skip integration test in -short mode")
	}

	migrationFiles := loadMigrationFiles(t, "../../migrations")
	if len(migrationFiles) == 0 {
		t.Skip("no migration files in apps/api/migrations; run `mise run ent:diff initial` first")
	}

	ctx := context.Background()

	container, err := tcpostgres.Run(ctx,
		"postgres:17-alpine",
		tcpostgres.WithDatabase("portfolio_test"),
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

	repo, err := repository.NewPostgres(ctx, dsn)
	if err != nil {
		t.Fatalf("NewPostgres: %v", err)
	}
	t.Cleanup(func() {
		_ = repo.Close()
	})

	// 空 DB でも GetPortfolio が成功すること (zero value 返却)
	t.Run("empty database", func(t *testing.T) {
		got, err := repo.GetPortfolio(ctx)
		if err != nil {
			t.Fatalf("GetPortfolio: %v", err)
		}
		if got == nil {
			t.Fatal("expected non-nil portfolio")
		}
		if len(got.Projects) != 0 {
			t.Errorf("expected 0 projects, got %d", len(got.Projects))
		}
		if len(got.Techs) != 0 {
			t.Errorf("expected 0 techs, got %d", len(got.Techs))
		}
	})

	// テスト用にデータを挿入してから検証
	t.Run("with seed data", func(t *testing.T) {
		seedFixtureData(t, ctx, dsn)

		got, err := repo.GetPortfolio(ctx)
		if err != nil {
			t.Fatalf("GetPortfolio: %v", err)
		}

		// Project: period_start DESC で並ぶことを検証
		if len(got.Projects) != 2 {
			t.Fatalf("expected 2 projects, got %d", len(got.Projects))
		}
		if got.Projects[0].ID != "p-newer" {
			t.Errorf("expected first project id=p-newer (newer start), got %q", got.Projects[0].ID)
		}
		if got.Projects[1].ID != "p-older" {
			t.Errorf("expected second project id=p-older, got %q", got.Projects[1].ID)
		}
		// Many-to-many edges
		if want := []string{"go", "react"}; !equalSorted(got.Projects[0].TechIDs, want) {
			t.Errorf("p-newer techIds = %v, want %v (any order)", got.Projects[0].TechIDs, want)
		}
		if want := []string{"design", "development"}; !equalSorted(got.Projects[0].PhaseIDs, want) {
			t.Errorf("p-newer phaseIds = %v, want %v (any order)", got.Projects[0].PhaseIDs, want)
		}
		// PeriodEnd (nullable) の動作確認: ongoing project は nil
		if got.Projects[0].PeriodEnd != nil {
			t.Errorf("p-newer periodEnd should be nil (ongoing), got %v", got.Projects[0].PeriodEnd)
		}
		if got.Projects[1].PeriodEnd == nil {
			t.Errorf("p-older periodEnd should be set, got nil")
		}

		// Tech / Phase の display_order 順序検証
		if len(got.Techs) != 2 {
			t.Fatalf("expected 2 techs, got %d", len(got.Techs))
		}
		if got.Techs[0].ID != "go" || got.Techs[1].ID != "react" {
			t.Errorf("techs order = [%s, %s], want [go, react]", got.Techs[0].ID, got.Techs[1].ID)
		}

		// Requirements の kind 振り分け検証
		if len(got.Requirements.MustHave) != 1 || got.Requirements.MustHave[0] != "Go の経験" {
			t.Errorf("MustHave = %v, want [Go の経験]", got.Requirements.MustHave)
		}
		if len(got.Requirements.NiceToHave) != 1 || got.Requirements.NiceToHave[0] != "React の経験" {
			t.Errorf("NiceToHave = %v, want [React の経験]", got.Requirements.NiceToHave)
		}

		// Pricing singleton + patterns
		if got.Pricing.Rate != "1円/h" {
			t.Errorf("pricing.rate = %q, want %q", got.Pricing.Rate, "1円/h")
		}
		if len(got.Pricing.Patterns) != 1 || got.Pricing.Patterns[0].Label != "パターンA" {
			t.Errorf("pricing.patterns = %v", got.Pricing.Patterns)
		}
	})
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
// atlas migrate apply を使わないのは、テストで atlas CLI 依存を避けるため。
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

// seedFixtureData はテスト fixture を直接 SQL で投入する。
//
// ent client を使わない理由: NewPostgres が返す client を再利用すると、
// migration 後の "ent から見た schema" と "実 DB schema" が完全一致してないと
// insert がコケるリスクがあり、原因切り分けが面倒になるため。raw SQL なら
// テストの意図 (DB → repository → JSON) が一直線に追える。
func seedFixtureData(t *testing.T, ctx context.Context, dsn string) {
	t.Helper()
	conn, err := pgx.Connect(ctx, dsn)
	if err != nil {
		t.Fatalf("pgx connect: %v", err)
	}
	defer conn.Close(ctx)

	stmts := []string{
		// Tech
		`INSERT INTO techs (id, label, category, display_order) VALUES
			('go', 'Go', 'language', 1),
			('react', 'React', 'framework', 2)`,
		// Phase
		`INSERT INTO phases (id, label, display_order) VALUES
			('design', '設計', 1),
			('development', '実装', 2)`,
		// Project (1: newer, ongoing / 2: older, finished)
		`INSERT INTO projects (id, title, period_start, period_end, team, role, summary) VALUES
			('p-newer', 'New Project', '2024-01-01', NULL, '4名', 'PG', 'recent ongoing'),
			('p-older', 'Old Project', '2018-04-01', '2019-12-31', '3名', 'PG', 'past project')`,
		// Project ↔ Tech (many-to-many join table; ent generates "project_techs")
		`INSERT INTO project_techs (project_id, tech_id) VALUES
			('p-newer', 'go'),
			('p-newer', 'react'),
			('p-older', 'go')`,
		// Project ↔ Phase
		`INSERT INTO project_phases (project_id, phase_id) VALUES
			('p-newer', 'design'),
			('p-newer', 'development'),
			('p-older', 'development')`,
		// FAQ
		`INSERT INTO faq_items (question, answer, display_order) VALUES
			('対応可能?', 'はい', 1)`,
		// Benefit
		`INSERT INTO benefits (title, description, display_order) VALUES
			('柔軟な稼働', '週20h〜', 1)`,
		// Requirement (kind enum)
		`INSERT INTO requirements (kind, text, display_order) VALUES
			('must_have', 'Go の経験', 1),
			('nice_to_have', 'React の経験', 1)`,
		// WorkCondition
		`INSERT INTO work_conditions (label, value, display_order) VALUES
			('稼働', '週20h', 1)`,
		// PainPoint
		`INSERT INTO pain_points (title, description, display_order) VALUES
			('困りごと', '...', 1)`,
		// Pricing (singleton)
		`INSERT INTO pricings (id, rate, billing_hours, trial_rate, trial_note) VALUES
			(1, '1円/h', '実稼働', '1円/h', 'お試し')`,
		// PricingPattern (FK pricing_id → pricings.id)
		`INSERT INTO pricing_patterns (label, trial_flex, trial_period, regular_flex, regular_period, display_order, pricing_id) VALUES
			('パターンA', 0, '1ヶ月', 0, '2ヶ月目〜', 1, 1)`,
	}
	for _, s := range stmts {
		if _, err := conn.Exec(ctx, s); err != nil {
			t.Fatalf("seed insert: %v\nSQL: %s", err, s)
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
