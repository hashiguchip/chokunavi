package repository

import (
	"context"
	"fmt"

	"entgo.io/ent/dialect"
	entsql "entgo.io/ent/dialect/sql"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jackc/pgx/v5/stdlib"

	"github.com/hashiguchip/resume_2026/apps/api/ent"
	"github.com/hashiguchip/resume_2026/apps/api/ent/benefit"
	"github.com/hashiguchip/resume_2026/apps/api/ent/faqitem"
	"github.com/hashiguchip/resume_2026/apps/api/ent/painpoint"
	"github.com/hashiguchip/resume_2026/apps/api/ent/phase"
	"github.com/hashiguchip/resume_2026/apps/api/ent/pricingpattern"
	"github.com/hashiguchip/resume_2026/apps/api/ent/project"
	"github.com/hashiguchip/resume_2026/apps/api/ent/requirement"
	"github.com/hashiguchip/resume_2026/apps/api/ent/tech"
	"github.com/hashiguchip/resume_2026/apps/api/ent/workcondition"
)

// PostgresRepo は ent + pgxpool で構築した PortfolioRepository 実装。
//
// pgxpool で接続を持ち、stdlib.OpenDBFromPool で database/sql に橋渡し、
// その上に ent client を載せる。
//   - pgxpool: 実際の接続管理 (native pgx の lifecycle/監視)
//   - database/sql: ent が要求する driver interface
//   - ent: query API
type PostgresRepo struct {
	client *ent.Client
	pool   *pgxpool.Pool
}

// NewPostgres は database URL を受け取り、Postgres backed repository を構築する。
// ctx は初期接続 (pgxpool 作成) に使われ、以降の query では使われない。
func NewPostgres(ctx context.Context, databaseURL string) (*PostgresRepo, error) {
	cfg, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, fmt.Errorf("parse database url: %w", err)
	}
	pool, err := pgxpool.NewWithConfig(ctx, cfg)
	if err != nil {
		return nil, fmt.Errorf("create pgxpool: %w", err)
	}
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("ping postgres: %w", err)
	}

	db := stdlib.OpenDBFromPool(pool)
	drv := entsql.OpenDB(dialect.Postgres, db)
	client := ent.NewClient(ent.Driver(drv))

	return &PostgresRepo{client: client, pool: pool}, nil
}

// Close は基盤の connection pool を解放する。main.go が defer で呼び出す想定。
func (r *PostgresRepo) Close() error {
	r.pool.Close()
	return nil
}

// GetPortfolio は全 entity を読み込み、aggregate response 用の型に詰め直す。
//
// データ件数が 100 オーダーで読み取り専用なので素朴に並列化せず順次取得する。
// 各 list は次のソート規則で安定化する:
//   - Project: period_start DESC, id ASC (新しいプロジェクトが上、同期間は id 順)
//   - Tech / Phase / FAQ / Benefit / Requirement / WorkCondition / PainPoint /
//     PricingPattern: display_order ASC, id ASC
//
// Pricing は singleton 想定で First を取り、見つからなければ zero value を返す。
func (r *PostgresRepo) GetPortfolio(ctx context.Context) (*Portfolio, error) {
	projects, err := r.client.Project.Query().
		WithTechs(func(q *ent.TechQuery) {
			q.Order(ent.Asc(tech.FieldDisplayOrder), ent.Asc(tech.FieldID))
		}).
		WithPhases(func(q *ent.PhaseQuery) {
			q.Order(ent.Asc(phase.FieldDisplayOrder), ent.Asc(phase.FieldID))
		}).
		Order(ent.Desc(project.FieldPeriodStart), ent.Asc(project.FieldID)).
		All(ctx)
	if err != nil {
		return nil, fmt.Errorf("query projects: %w", err)
	}

	techs, err := r.client.Tech.Query().
		Order(ent.Asc(tech.FieldDisplayOrder), ent.Asc(tech.FieldID)).
		All(ctx)
	if err != nil {
		return nil, fmt.Errorf("query techs: %w", err)
	}

	phases, err := r.client.Phase.Query().
		Order(ent.Asc(phase.FieldDisplayOrder), ent.Asc(phase.FieldID)).
		All(ctx)
	if err != nil {
		return nil, fmt.Errorf("query phases: %w", err)
	}

	faqs, err := r.client.FAQItem.Query().
		Order(ent.Asc(faqitem.FieldDisplayOrder), ent.Asc(faqitem.FieldID)).
		All(ctx)
	if err != nil {
		return nil, fmt.Errorf("query faq items: %w", err)
	}

	benefits, err := r.client.Benefit.Query().
		Order(ent.Asc(benefit.FieldDisplayOrder), ent.Asc(benefit.FieldID)).
		All(ctx)
	if err != nil {
		return nil, fmt.Errorf("query benefits: %w", err)
	}

	reqs, err := r.client.Requirement.Query().
		Order(
			ent.Asc(requirement.FieldKind),
			ent.Asc(requirement.FieldDisplayOrder),
			ent.Asc(requirement.FieldID),
		).
		All(ctx)
	if err != nil {
		return nil, fmt.Errorf("query requirements: %w", err)
	}

	workConds, err := r.client.WorkCondition.Query().
		Order(ent.Asc(workcondition.FieldDisplayOrder), ent.Asc(workcondition.FieldID)).
		All(ctx)
	if err != nil {
		return nil, fmt.Errorf("query work conditions: %w", err)
	}

	painPoints, err := r.client.PainPoint.Query().
		Order(ent.Asc(painpoint.FieldDisplayOrder), ent.Asc(painpoint.FieldID)).
		All(ctx)
	if err != nil {
		return nil, fmt.Errorf("query pain points: %w", err)
	}

	pricingRow, err := r.client.Pricing.Query().
		WithPatterns(func(q *ent.PricingPatternQuery) {
			q.Order(ent.Asc(pricingpattern.FieldDisplayOrder), ent.Asc(pricingpattern.FieldID))
		}).
		First(ctx)
	if err != nil && !ent.IsNotFound(err) {
		return nil, fmt.Errorf("query pricing: %w", err)
	}

	out := &Portfolio{
		Projects:       projectsToRepo(projects),
		Techs:          techsToRepo(techs),
		Phases:         phasesToRepo(phases),
		FAQ:            faqsToRepo(faqs),
		Benefits:       benefitsToRepo(benefits),
		Requirements:   requirementsToRepo(reqs),
		WorkConditions: workConditionsToRepo(workConds),
		PainPoints:     painPointsToRepo(painPoints),
	}
	if pricingRow != nil {
		out.Pricing = pricingToRepo(pricingRow)
	}
	return out, nil
}

func projectsToRepo(in []*ent.Project) []Project {
	out := make([]Project, 0, len(in))
	for _, p := range in {
		techIDs := make([]string, 0, len(p.Edges.Techs))
		for _, t := range p.Edges.Techs {
			techIDs = append(techIDs, t.ID)
		}
		phaseIDs := make([]string, 0, len(p.Edges.Phases))
		for _, ph := range p.Edges.Phases {
			phaseIDs = append(phaseIDs, ph.ID)
		}
		out = append(out, Project{
			ID:          p.ID,
			Title:       p.Title,
			PeriodStart: p.PeriodStart,
			PeriodEnd:   p.PeriodEnd,
			Team:        p.Team,
			Role:        p.Role,
			TechIDs:     techIDs,
			PhaseIDs:    phaseIDs,
			Summary:     p.Summary,
		})
	}
	return out
}

func techsToRepo(in []*ent.Tech) []Tech {
	out := make([]Tech, 0, len(in))
	for _, t := range in {
		out = append(out, Tech{ID: t.ID, Label: t.Label, Category: t.Category})
	}
	return out
}

func phasesToRepo(in []*ent.Phase) []Phase {
	out := make([]Phase, 0, len(in))
	for _, p := range in {
		out = append(out, Phase{ID: p.ID, Label: p.Label})
	}
	return out
}

func faqsToRepo(in []*ent.FAQItem) []FAQItem {
	out := make([]FAQItem, 0, len(in))
	for _, f := range in {
		out = append(out, FAQItem{Q: f.Question, A: f.Answer})
	}
	return out
}

func benefitsToRepo(in []*ent.Benefit) []Benefit {
	out := make([]Benefit, 0, len(in))
	for _, b := range in {
		out = append(out, Benefit{Title: b.Title, Description: b.Description})
	}
	return out
}

func requirementsToRepo(in []*ent.Requirement) Requirements {
	var out Requirements
	for _, r := range in {
		switch r.Kind {
		case requirement.KindMustHave:
			out.MustHave = append(out.MustHave, r.Text)
		case requirement.KindNiceToHave:
			out.NiceToHave = append(out.NiceToHave, r.Text)
		}
	}
	return out
}

func workConditionsToRepo(in []*ent.WorkCondition) []WorkCondition {
	out := make([]WorkCondition, 0, len(in))
	for _, w := range in {
		out = append(out, WorkCondition{Label: w.Label, Value: w.Value})
	}
	return out
}

func painPointsToRepo(in []*ent.PainPoint) []PainPoint {
	out := make([]PainPoint, 0, len(in))
	for _, p := range in {
		out = append(out, PainPoint{Title: p.Title, Description: p.Description})
	}
	return out
}

func pricingToRepo(in *ent.Pricing) Pricing {
	patterns := make([]PricingPattern, 0, len(in.Edges.Patterns))
	for _, p := range in.Edges.Patterns {
		patterns = append(patterns, PricingPattern{
			Label:         p.Label,
			TrialFlex:     p.TrialFlex,
			TrialPeriod:   p.TrialPeriod,
			RegularFlex:   p.RegularFlex,
			RegularPeriod: p.RegularPeriod,
		})
	}
	return Pricing{
		Rate:         in.Rate,
		BillingHours: in.BillingHours,
		TrialRate:    in.TrialRate,
		TrialNote:    in.TrialNote,
		Patterns:     patterns,
	}
}
