package middleware

import (
	"context"
	"errors"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"github.com/hashiguchip/chokunavi/apps/api/internal/repository"
)

// userCtxKeyType は context.Value の key 衝突を避けるための privé な型。
type userCtxKeyType struct{}

var userCtxKey = userCtxKeyType{}

// UserFromContext は Auth middleware が request context に格納した user を取り出す。
// 認証が通った operation でのみ non-nil。未認証 operation では nil, false。
func UserFromContext(ctx context.Context) (*repository.User, bool) {
	u, ok := ctx.Value(userCtxKey).(*repository.User)
	return u, ok
}

// Auth は huma operation 単位の認証 middleware を返す。
//
// Operation.Security が空の operation (e.g. /healthz) は素通し、Security が
// 設定されている operation (e.g. /api/app-data) のみ X-Referral-Code を検証する。
// 検証は users テーブルに対する plaintext lookup (revoked_at IS NULL 条件付き)。
// hash 化はしない: このプロジェクトの脅威モデル上 plaintext で十分と判断した
// (詳細は repository/user.go と README 参照)。
//
// 認証成功時は repository.User を request context に格納する。handler 側からは
// middleware.UserFromContext で取り出せる。
func Auth(api huma.API, repo repository.UserRepository) func(huma.Context, func(huma.Context)) {
	return func(ctx huma.Context, next func(huma.Context)) {
		op := ctx.Operation()
		if op == nil || len(op.Security) == 0 {
			next(ctx)
			return
		}

		code := ctx.Header("X-Referral-Code")
		if code == "" {
			_ = huma.WriteErr(api, ctx, http.StatusUnauthorized, "missing referral code")
			return
		}

		user, err := repo.FindByCode(ctx.Context(), code)
		if errors.Is(err, repository.ErrUserNotFound) {
			_ = huma.WriteErr(api, ctx, http.StatusUnauthorized, "invalid referral code")
			return
		}
		if err != nil {
			_ = huma.WriteErr(api, ctx, http.StatusInternalServerError, "auth lookup failed")
			return
		}

		ctx = huma.WithValue(ctx, userCtxKey, user)
		next(ctx)
	}
}
