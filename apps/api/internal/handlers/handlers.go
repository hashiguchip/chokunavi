package handlers

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"github.com/hashiguchip/resume_2026/apps/api/internal/repository"
)

// RegisterAll は huma API に全 operation を登録する。
//
// main.go と cmd/openapi の両方から呼ばれる single source of truth。
// ここに operation を追加することで自動的に live server と OpenAPI 生成の
// 両方に反映される。
func RegisterAll(api huma.API, repo repository.PortfolioRepository) {
	registerHealthz(api)
	RegisterPortfolio(api, repo)
}

// HealthzOutput は /healthz の response body を表す。
// huma の規約上、Body フィールドが JSON にシリアライズされる。
type HealthzOutput struct {
	Body struct {
		Status string `json:"status" example:"ok" doc:"Service status"`
	}
}

// registerHealthz は GET /healthz を huma に登録する。
// Operation.Security を空にしておくことで middleware.Auth が gate しない。
func registerHealthz(api huma.API) {
	huma.Register(api, huma.Operation{
		OperationID: "healthz",
		Method:      http.MethodGet,
		Path:        "/healthz",
		Summary:     "Liveness probe",
	}, func(_ context.Context, _ *struct{}) (*HealthzOutput, error) {
		out := &HealthzOutput{}
		out.Body.Status = "ok"
		return out, nil
	})
}
