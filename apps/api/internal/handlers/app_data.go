// Package handlers は huma operation の登録を行う。
package handlers

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"github.com/hashiguchip/chokunavi/apps/api/internal/middleware"
	"github.com/hashiguchip/chokunavi/apps/api/internal/repository"
)

// AppDataInput は X-Referral-Code を required として OpenAPI に露出させる。
// 実際の auth check は middleware.Auth が行うため、ここでの required は
// ドキュメント / クライアント生成のための宣言の意味合いが大きい。
type AppDataInput struct {
	XReferralCode string `header:"X-Referral-Code" required:"true" doc:"Pre-shared referral code"`
}

type AppDataOutput struct {
	Body *repository.AppData
}

// RegisterAppData は GET /api/app-data を huma に登録する。
//
// middleware.Auth が認証成功時に request context に埋めた User を取り出し、
// その user に紐づく pricing + 全 projects を返す。
func RegisterAppData(api huma.API, repo repository.AppDataRepository) {
	huma.Register(api, huma.Operation{
		OperationID: "get-app-data",
		Method:      http.MethodGet,
		Path:        "/api/app-data",
		Summary:     "Aggregate app data",
		Description: "Returns the projects and the pricing plan associated with the authenticated user.",
		Security:    []map[string][]string{{"referralCode": {}}},
	}, func(ctx context.Context, _ *AppDataInput) (*AppDataOutput, error) {
		u, ok := middleware.UserFromContext(ctx)
		if !ok || u == nil {
			return nil, huma.Error500InternalServerError("missing user in context")
		}
		p, err := repo.GetAppDataForUser(ctx, u.ID)
		if err != nil {
			return nil, huma.Error500InternalServerError("failed to load app data", err)
		}
		return &AppDataOutput{Body: p}, nil
	})
}
