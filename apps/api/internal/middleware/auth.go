package middleware

import (
	"crypto/sha256"
	"crypto/subtle"
	"encoding/hex"
	"net/http"

	"github.com/danielgtaylor/huma/v2"
)

// Auth は huma operation 単位の認証 middleware を返す。
//
// Operation.Security が空の operation (e.g. /healthz) は素通し、Security が
// 設定されている operation (e.g. /api/portfolio) のみ X-Referral-Code を検証する。
// 比較は SHA-256 で hash 化した上で subtle.ConstantTimeCompare を使う。
func Auth(api huma.API, allowedHashes []string) func(huma.Context, func(huma.Context)) {
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

		sum := sha256.Sum256([]byte(code))
		hash := hex.EncodeToString(sum[:])
		if !matchHash(hash, allowedHashes) {
			_ = huma.WriteErr(api, ctx, http.StatusUnauthorized, "invalid referral code")
			return
		}

		next(ctx)
	}
}

// matchHash は loop 内で early-return せず、定数時間比較を維持する。
func matchHash(hash string, allowed []string) bool {
	matched := false
	for _, a := range allowed {
		if subtle.ConstantTimeCompare([]byte(hash), []byte(a)) == 1 {
			matched = true
		}
	}
	return matched
}
