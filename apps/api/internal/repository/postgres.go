package repository

import (
	"context"
	"fmt"

	"entgo.io/ent/dialect"
	entsql "entgo.io/ent/dialect/sql"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jackc/pgx/v5/stdlib"

	"github.com/hashiguchip/chokunavi/apps/api/ent"
	"github.com/hashiguchip/chokunavi/apps/api/ent/pricingpattern"
	"github.com/hashiguchip/chokunavi/apps/api/ent/project"
	"github.com/hashiguchip/chokunavi/apps/api/ent/user"
)

// OpenEntClient は database URL から pgxpool を作って ent client を構築し、
// client / pool / 解放用 closeFn を返す。
//
// 接続スタックの構成:
//   - pgxpool: 実際の接続管理 (native pgx の lifecycle/監視)
//   - database/sql: ent が要求する driver interface
//   - ent: query API
//
// 呼び出し側 (main.go, cmd/seed) は同じ client から AppDataRepo / UserRepo を
// 構築し、defer closeFn() で一括解放する。ctx は初期接続 (pgxpool 作成 + Ping)
// にだけ使われ、以降の query では使われない。
func OpenEntClient(ctx context.Context, databaseURL string) (*ent.Client, *pgxpool.Pool, func(), error) {
	cfg, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, nil, nil, fmt.Errorf("parse database url: %w", err)
	}
	pool, err := pgxpool.NewWithConfig(ctx, cfg)
	if err != nil {
		return nil, nil, nil, fmt.Errorf("create pgxpool: %w", err)
	}
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, nil, nil, fmt.Errorf("ping postgres: %w", err)
	}

	db := stdlib.OpenDBFromPool(pool)
	drv := entsql.OpenDB(dialect.Postgres, db)
	client := ent.NewClient(ent.Driver(drv))
	closeFn := func() {
		_ = client.Close()
		pool.Close()
	}
	return client, pool, closeFn, nil
}

// PostgresRepo は ent client を保持する AppDataRepository 実装。
type PostgresRepo struct {
	client *ent.Client
}

// NewAppDataRepo は ent client を受け取り AppDataRepository を返す。
// connection の所有権は呼び出し側 (OpenEntClient の closeFn) にある。
func NewAppDataRepo(client *ent.Client) *PostgresRepo {
	return &PostgresRepo{client: client}
}

// GetAppDataForUser は user に紐づく pricing と全 projects を 1 まとめで返す。
//
//   - 全 user 共通: projects (display_order ASC, id ASC)
//   - user 固有: pricing (User → Pricing edge を辿って取得、patterns 込み)
//
// pricing が user に紐づいてない場合は zero value を返す (auth は通っている前提
// なので handler は 200 を返す)。
func (r *PostgresRepo) GetAppDataForUser(ctx context.Context, userID int) (*AppData, error) {
	projects, err := r.client.Project.Query().
		Order(ent.Asc(project.FieldDisplayOrder), ent.Asc(project.FieldID)).
		All(ctx)
	if err != nil {
		return nil, fmt.Errorf("query projects: %w", err)
	}

	pricingRow, err := r.client.User.
		Query().
		Where(user.IDEQ(userID)).
		QueryPricing().
		WithPatterns(func(q *ent.PricingPatternQuery) {
			q.Order(ent.Asc(pricingpattern.FieldDisplayOrder), ent.Asc(pricingpattern.FieldID))
		}).
		First(ctx)
	if err != nil && !ent.IsNotFound(err) {
		return nil, fmt.Errorf("query pricing for user %d: %w", userID, err)
	}

	out := &AppData{
		Projects: projectsToRepo(projects),
	}
	if pricingRow != nil {
		p := pricingToRepo(pricingRow)
		out.Pricing = &p
	}
	return out, nil
}

func projectsToRepo(in []*ent.Project) []Project {
	out := make([]Project, 0, len(in))
	for _, p := range in {
		out = append(out, Project{
			ID:          p.ID,
			Title:       p.Title,
			PeriodStart: p.PeriodStart,
			PeriodEnd:   p.PeriodEnd,
			Team:        p.Team,
			Role:        p.Role,
			Summary:     p.Summary,
			TechIDs:     append([]string(nil), p.TechIds...),
			PhaseIDs:    append([]string(nil), p.PhaseIds...),
		})
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
