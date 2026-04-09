// Command seed は SOPS で暗号化された YAML を復号して Postgres に投入する CLI。
//
// 使い方:
//
//	DATABASE_URL=postgres://... go run ./cmd/seed seed/portfolio.yaml
//
// 環境変数:
//   - DATABASE_URL (必須): Postgres DSN
//   - SOPS_AGE_KEY_FILE: age private key の path (default は SOPS の探索順に従う)
//
// 動作:
//  1. YAML を SOPS で復号
//  2. seedFile struct に Unmarshal、最低限の整合性を validate
//  3. transaction を開始
//  4. 全テーブルを削除 → YAML の内容を insert (idempotent: 何度実行しても同じ結果)
//  5. commit
//
// 「UPSERT ではなく delete + insert」は意図的:
//   - Project の M:N edge を OnConflict と組み合わせて綺麗に扱うのが面倒
//   - section 系 (FAQ, Benefit, …) は natural key を持たないので UPSERT 不可
//   - データ件数が小さく (~100 行)、seed は手動投入なので速度は問題にならない
//   - delete + insert なら「YAML の状態 = DB の状態」が自明に保証される
//     (UPSERT だと「YAML から消えた行を DB から消し忘れる」バグの余地が残る)
//
// 削除順序は FK 依存に従う:
//
//	projects (CASCADE で project_techs / project_phases も消える)
//	  → techs / phases
//	pricing_patterns (pricing_id は ON DELETE SET NULL なので親より先に消す)
//	  → pricings
//	faq_items / benefits / requirements / work_conditions / pain_points (FK 無し)
package main

import (
	"bytes"
	"context"
	"fmt"
	"log/slog"
	"os"
	"os/exec"
	"strings"
	"time"

	"entgo.io/ent/dialect"
	entsql "entgo.io/ent/dialect/sql"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jackc/pgx/v5/stdlib"
	"gopkg.in/yaml.v3"

	"github.com/hashiguchip/resume_2026/apps/api/ent"
	"github.com/hashiguchip/resume_2026/apps/api/ent/requirement"
)

// seedFile は portfolio.yaml の root 構造。
//
// JSON tag ではなく yaml tag を付けること。snake_case で揃える。
//
// 日付フィールドは time.Time にしておく。yaml.v3 が `!!timestamp` (ISO date 等)
// を自動的に Go の time.Time に変換してくれるので、`2024-01-01` でも
// `2024-01-01T00:00:00Z` でも受け付けられる。
// (SOPS は decrypt 時に日付を RFC3339 に正規化するので、両方扱える必要がある)
type seedFile struct {
	Techs          []seedTech          `yaml:"techs"`
	Phases         []seedPhase         `yaml:"phases"`
	Projects       []seedProject       `yaml:"projects"`
	FAQ            []seedFAQItem       `yaml:"faq"`
	Benefits       []seedBenefit       `yaml:"benefits"`
	Requirements   seedRequirements    `yaml:"requirements"`
	WorkConditions []seedWorkCondition `yaml:"work_conditions"`
	PainPoints     []seedPainPoint     `yaml:"pain_points"`
	Pricing        seedPricing         `yaml:"pricing"`
}

type seedTech struct {
	ID           string `yaml:"id"`
	Label        string `yaml:"label"`
	Category     string `yaml:"category"`
	DisplayOrder int    `yaml:"display_order"`
}

type seedPhase struct {
	ID           string `yaml:"id"`
	Label        string `yaml:"label"`
	DisplayOrder int    `yaml:"display_order"`
}

type seedProject struct {
	ID          string     `yaml:"id"`
	Title       string     `yaml:"title"`
	PeriodStart time.Time  `yaml:"period_start"`
	PeriodEnd   *time.Time `yaml:"period_end"` // nil = 現在進行中
	Team        string     `yaml:"team"`
	Role        string     `yaml:"role"`
	Summary     string     `yaml:"summary"`
	TechIDs     []string   `yaml:"tech_ids"`
	PhaseIDs    []string   `yaml:"phase_ids"`
}

type seedFAQItem struct {
	Question     string `yaml:"question"`
	Answer       string `yaml:"answer"`
	DisplayOrder int    `yaml:"display_order"`
}

type seedBenefit struct {
	Title        string `yaml:"title"`
	Description  string `yaml:"description"`
	DisplayOrder int    `yaml:"display_order"`
}

// seedRequirements は must_have / nice_to_have の 2 リストを持つ。
// 個々の要素は単なる string で、display_order は slice index から自動付番する。
type seedRequirements struct {
	MustHave   []string `yaml:"must_have"`
	NiceToHave []string `yaml:"nice_to_have"`
}

type seedWorkCondition struct {
	Label        string `yaml:"label"`
	Value        string `yaml:"value"`
	DisplayOrder int    `yaml:"display_order"`
}

type seedPainPoint struct {
	Title        string `yaml:"title"`
	Description  string `yaml:"description"`
	DisplayOrder int    `yaml:"display_order"`
}

type seedPricing struct {
	Rate         string               `yaml:"rate"`
	BillingHours string               `yaml:"billing_hours"`
	TrialRate    string               `yaml:"trial_rate"`
	TrialNote    string               `yaml:"trial_note"`
	Patterns     []seedPricingPattern `yaml:"patterns"`
}

type seedPricingPattern struct {
	Label         string `yaml:"label"`
	TrialFlex     int    `yaml:"trial_flex"`
	TrialPeriod   string `yaml:"trial_period"`
	RegularFlex   int    `yaml:"regular_flex"`
	RegularPeriod string `yaml:"regular_period"`
	DisplayOrder  int    `yaml:"display_order"`
}

func main() {
	if len(os.Args) != 2 {
		fmt.Fprintln(os.Stderr, "usage: seed <yaml-path>")
		os.Exit(2)
	}
	yamlPath := os.Args[1]

	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		slog.Error("DATABASE_URL must be set")
		os.Exit(1)
	}

	// 全工程を 60s 以内で完結させる context (sops 復号 + DB 操作)
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	// 1. SOPS CLI に shell-out して復号
	plaintext, err := decryptYAML(ctx, yamlPath)
	if err != nil {
		slog.Error("decrypt seed file", "path", yamlPath, "err", err)
		os.Exit(1)
	}

	// 2. Unmarshal
	var seed seedFile
	if err := yaml.Unmarshal(plaintext, &seed); err != nil {
		slog.Error("unmarshal seed yaml", "err", err)
		os.Exit(1)
	}

	// 3. validate (DB に当てる前に YAML 内整合性を確認)
	if err := validateSeed(&seed); err != nil {
		slog.Error("validate seed", "err", err)
		os.Exit(1)
	}

	// 4. ent client (pgxpool 経由) を構築
	client, closeFn, err := openEntClient(ctx, databaseURL)
	if err != nil {
		slog.Error("open ent client", "err", err)
		os.Exit(1)
	}
	defer closeFn()

	// 5. 単一 transaction で適用
	if err := applySeed(ctx, client, &seed); err != nil {
		slog.Error("apply seed", "err", err)
		os.Exit(1)
	}

	slog.Info("seed applied",
		"techs", len(seed.Techs),
		"phases", len(seed.Phases),
		"projects", len(seed.Projects),
		"faq", len(seed.FAQ),
		"benefits", len(seed.Benefits),
		"must_have", len(seed.Requirements.MustHave),
		"nice_to_have", len(seed.Requirements.NiceToHave),
		"work_conditions", len(seed.WorkConditions),
		"pain_points", len(seed.PainPoints),
		"pricing_patterns", len(seed.Pricing.Patterns),
	)
}

// decryptYAML は sops CLI に shell-out して暗号化された YAML を復号する。
//
// SOPS の Go library (getsops/sops/v3/decrypt) を使わない理由:
// AWS/Azure/GCP/Vault などの key provider を全部 bundle するため indirect deps
// が ~100 増え、cmd/seed binary が ~65MB 太る。age 1 つしか使わないので
// shell-out が圧倒的に軽い。`sops` CLI は seed 編集 (sops apps/api/seed/*.yaml)
// にも必要なので、追加依存にはならない。
//
// PATH 解決は `mise run seed:apply` 経由を前提とする。直接 `go run ./cmd/seed`
// で起動すると homebrew 等の別バージョンが当たる可能性あり (README 参照)。
func decryptYAML(ctx context.Context, path string) ([]byte, error) {
	cmd := exec.CommandContext(ctx, "sops", "-d", path)
	var stderr bytes.Buffer
	cmd.Stderr = &stderr
	out, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("sops -d %s: %w (stderr: %s)", path, err, strings.TrimSpace(stderr.String()))
	}
	return out, nil
}

// openEntClient は pgxpool を作って ent client を組み立て、
// 全てを解放する closeFn を返す。
//
// repository.NewPostgres と同じ手順だが、internal/ を改変したくないので
// この cmd のために 1 回だけ複製している。
func openEntClient(ctx context.Context, databaseURL string) (*ent.Client, func(), error) {
	cfg, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, nil, fmt.Errorf("parse database url: %w", err)
	}
	pool, err := pgxpool.NewWithConfig(ctx, cfg)
	if err != nil {
		return nil, nil, fmt.Errorf("create pgxpool: %w", err)
	}
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, nil, fmt.Errorf("ping postgres: %w", err)
	}
	db := stdlib.OpenDBFromPool(pool)
	drv := entsql.OpenDB(dialect.Postgres, db)
	client := ent.NewClient(ent.Driver(drv))
	closeFn := func() {
		_ = client.Close()
		pool.Close()
	}
	return client, closeFn, nil
}

// validateSeed は DB アクセス前に YAML 内の整合性をチェックする。
//
//   - tech / phase / project の id が空でなく重複していない
//   - project に period_start が指定されている (yaml.v3 の自動 parse 任せだと
//     値が空のとき zero time が入るので明示的に検出する)
//   - project.tech_ids / phase_ids が tech / phase の id と一致する
func validateSeed(s *seedFile) error {
	techIDs := make(map[string]struct{}, len(s.Techs))
	for _, t := range s.Techs {
		if t.ID == "" {
			return fmt.Errorf("tech: empty id")
		}
		if _, dup := techIDs[t.ID]; dup {
			return fmt.Errorf("tech: duplicate id %q", t.ID)
		}
		techIDs[t.ID] = struct{}{}
	}

	phaseIDs := make(map[string]struct{}, len(s.Phases))
	for _, p := range s.Phases {
		if p.ID == "" {
			return fmt.Errorf("phase: empty id")
		}
		if _, dup := phaseIDs[p.ID]; dup {
			return fmt.Errorf("phase: duplicate id %q", p.ID)
		}
		phaseIDs[p.ID] = struct{}{}
	}

	projectIDs := make(map[string]struct{}, len(s.Projects))
	for _, p := range s.Projects {
		if p.ID == "" {
			return fmt.Errorf("project: empty id")
		}
		if _, dup := projectIDs[p.ID]; dup {
			return fmt.Errorf("project: duplicate id %q", p.ID)
		}
		projectIDs[p.ID] = struct{}{}
		if p.PeriodStart.IsZero() {
			return fmt.Errorf("project %q: missing period_start", p.ID)
		}
		for _, tid := range p.TechIDs {
			if _, ok := techIDs[tid]; !ok {
				return fmt.Errorf("project %q: unknown tech_id %q", p.ID, tid)
			}
		}
		for _, phid := range p.PhaseIDs {
			if _, ok := phaseIDs[phid]; !ok {
				return fmt.Errorf("project %q: unknown phase_id %q", p.ID, phid)
			}
		}
	}
	return nil
}

// applySeed は単一 transaction で全テーブルを削除 → 再投入する。
func applySeed(ctx context.Context, client *ent.Client, s *seedFile) error {
	tx, err := client.Tx(ctx)
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	committed := false
	defer func() {
		if !committed {
			if rerr := tx.Rollback(); rerr != nil {
				slog.Warn("tx rollback failed", "err", rerr)
			}
		}
	}()

	if err := clearAll(ctx, tx); err != nil {
		return err
	}
	if err := insertAll(ctx, tx, s); err != nil {
		return err
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("commit: %w", err)
	}
	committed = true
	return nil
}

// clearAll は全テーブルを FK 依存順で削除する。
//
// projects → 残りの順。projects を消すと CASCADE で project_techs/phases も消える。
// pricing_patterns は親より先に消す (pricing_id は ON DELETE SET NULL なので、
// 親を先に消すと孤児パターンが残る)。
func clearAll(ctx context.Context, tx *ent.Tx) error {
	if _, err := tx.Project.Delete().Exec(ctx); err != nil {
		return fmt.Errorf("delete projects: %w", err)
	}
	if _, err := tx.Tech.Delete().Exec(ctx); err != nil {
		return fmt.Errorf("delete techs: %w", err)
	}
	if _, err := tx.Phase.Delete().Exec(ctx); err != nil {
		return fmt.Errorf("delete phases: %w", err)
	}
	if _, err := tx.PricingPattern.Delete().Exec(ctx); err != nil {
		return fmt.Errorf("delete pricing patterns: %w", err)
	}
	if _, err := tx.Pricing.Delete().Exec(ctx); err != nil {
		return fmt.Errorf("delete pricings: %w", err)
	}
	if _, err := tx.FAQItem.Delete().Exec(ctx); err != nil {
		return fmt.Errorf("delete faq items: %w", err)
	}
	if _, err := tx.Benefit.Delete().Exec(ctx); err != nil {
		return fmt.Errorf("delete benefits: %w", err)
	}
	if _, err := tx.Requirement.Delete().Exec(ctx); err != nil {
		return fmt.Errorf("delete requirements: %w", err)
	}
	if _, err := tx.WorkCondition.Delete().Exec(ctx); err != nil {
		return fmt.Errorf("delete work conditions: %w", err)
	}
	if _, err := tx.PainPoint.Delete().Exec(ctx); err != nil {
		return fmt.Errorf("delete pain points: %w", err)
	}
	return nil
}

// insertAll は YAML の内容を依存順に投入する。
//
// Tech, Phase は edge なし → 先に作る。
// Project は edge を持つので Tech / Phase の後。
// Pricing は子の PricingPattern を作るので先に Pricing を作って ID を取る。
func insertAll(ctx context.Context, tx *ent.Tx, s *seedFile) error {
	for _, t := range s.Techs {
		if _, err := tx.Tech.Create().
			SetID(t.ID).
			SetLabel(t.Label).
			SetCategory(t.Category).
			SetDisplayOrder(t.DisplayOrder).
			Save(ctx); err != nil {
			return fmt.Errorf("create tech %q: %w", t.ID, err)
		}
	}

	for _, p := range s.Phases {
		if _, err := tx.Phase.Create().
			SetID(p.ID).
			SetLabel(p.Label).
			SetDisplayOrder(p.DisplayOrder).
			Save(ctx); err != nil {
			return fmt.Errorf("create phase %q: %w", p.ID, err)
		}
	}

	for _, p := range s.Projects {
		create := tx.Project.Create().
			SetID(p.ID).
			SetTitle(p.Title).
			SetPeriodStart(p.PeriodStart).
			SetTeam(p.Team).
			SetRole(p.Role).
			SetSummary(p.Summary).
			AddTechIDs(p.TechIDs...).
			AddPhaseIDs(p.PhaseIDs...)
		if p.PeriodEnd != nil {
			create.SetPeriodEnd(*p.PeriodEnd)
		}
		if _, err := create.Save(ctx); err != nil {
			return fmt.Errorf("create project %q: %w", p.ID, err)
		}
	}

	pricing, err := tx.Pricing.Create().
		SetRate(s.Pricing.Rate).
		SetBillingHours(s.Pricing.BillingHours).
		SetTrialRate(s.Pricing.TrialRate).
		SetTrialNote(s.Pricing.TrialNote).
		Save(ctx)
	if err != nil {
		return fmt.Errorf("create pricing: %w", err)
	}
	for _, pat := range s.Pricing.Patterns {
		if _, err := tx.PricingPattern.Create().
			SetLabel(pat.Label).
			SetTrialFlex(pat.TrialFlex).
			SetTrialPeriod(pat.TrialPeriod).
			SetRegularFlex(pat.RegularFlex).
			SetRegularPeriod(pat.RegularPeriod).
			SetDisplayOrder(pat.DisplayOrder).
			SetPricing(pricing).
			Save(ctx); err != nil {
			return fmt.Errorf("create pricing pattern %q: %w", pat.Label, err)
		}
	}

	for _, f := range s.FAQ {
		if _, err := tx.FAQItem.Create().
			SetQuestion(f.Question).
			SetAnswer(f.Answer).
			SetDisplayOrder(f.DisplayOrder).
			Save(ctx); err != nil {
			return fmt.Errorf("create faq item: %w", err)
		}
	}

	for _, b := range s.Benefits {
		if _, err := tx.Benefit.Create().
			SetTitle(b.Title).
			SetDescription(b.Description).
			SetDisplayOrder(b.DisplayOrder).
			Save(ctx); err != nil {
			return fmt.Errorf("create benefit %q: %w", b.Title, err)
		}
	}

	// requirements は YAML では string list。slice index から display_order を付番して
	// repository.Requirements に詰め直す側 (postgres.go) で kind 別に並ぶ。
	for i, text := range s.Requirements.MustHave {
		if _, err := tx.Requirement.Create().
			SetKind(requirement.KindMustHave).
			SetText(text).
			SetDisplayOrder(i + 1).
			Save(ctx); err != nil {
			return fmt.Errorf("create must_have requirement: %w", err)
		}
	}
	for i, text := range s.Requirements.NiceToHave {
		if _, err := tx.Requirement.Create().
			SetKind(requirement.KindNiceToHave).
			SetText(text).
			SetDisplayOrder(i + 1).
			Save(ctx); err != nil {
			return fmt.Errorf("create nice_to_have requirement: %w", err)
		}
	}

	for _, w := range s.WorkConditions {
		if _, err := tx.WorkCondition.Create().
			SetLabel(w.Label).
			SetValue(w.Value).
			SetDisplayOrder(w.DisplayOrder).
			Save(ctx); err != nil {
			return fmt.Errorf("create work condition %q: %w", w.Label, err)
		}
	}

	for _, p := range s.PainPoints {
		if _, err := tx.PainPoint.Create().
			SetTitle(p.Title).
			SetDescription(p.Description).
			SetDisplayOrder(p.DisplayOrder).
			Save(ctx); err != nil {
			return fmt.Errorf("create pain point %q: %w", p.Title, err)
		}
	}

	return nil
}
