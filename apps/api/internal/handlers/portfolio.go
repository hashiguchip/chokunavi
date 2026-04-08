// Package handlers は huma operation の登録を行う。
package handlers

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"github.com/hashiguchip/resume_2026/apps/api/internal/repository"
)

// PortfolioInput は X-Referral-Code を required として OpenAPI に露出させる。
// 実際の auth check は middleware.Auth が行うため、ここでの required は
// ドキュメント / クライアント生成のための宣言の意味合いが大きい。
type PortfolioInput struct {
	XReferralCode string `header:"X-Referral-Code" required:"true" doc:"Pre-shared referral code"`
}

type PortfolioOutput struct {
	Body *repository.Portfolio
}

// RegisterPortfolio は GET /api/portfolio を huma に登録する。
// Security tag を設定することで middleware.Auth が gate 対象として識別する。
func RegisterPortfolio(api huma.API, repo repository.PortfolioRepository) {
	huma.Register(api, huma.Operation{
		OperationID: "get-portfolio",
		Method:      http.MethodGet,
		Path:        "/api/portfolio",
		Summary:     "Aggregate portfolio data",
		Description: "Returns projects, techs, phases, FAQ, sections, and pricing in one response.",
		Security:    []map[string][]string{{"referralCode": {}}},
	}, func(ctx context.Context, _ *PortfolioInput) (*PortfolioOutput, error) {
		p, err := repo.GetPortfolio(ctx)
		if err != nil {
			return nil, huma.Error500InternalServerError("failed to load portfolio", err)
		}
		return &PortfolioOutput{Body: p}, nil
	})
}
