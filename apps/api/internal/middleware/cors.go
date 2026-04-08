// Package middleware は HTTP / huma 共通の横断関心事を提供する。
package middleware

import (
	"net/http"
	"strings"
)

// CORS は許可 origin リストに基づき、CORS ヘッダを付与する stdlib middleware。
//
// huma の operation 単位ではなく mux 全体を wrap するため、preflight (OPTIONS)
// を含む全ての response に対して一貫してヘッダを返せる。preflight は 200 で
// short-circuit する (huma の operation には到達しない)。
func CORS(allowedOrigins []string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			origin := r.Header.Get("Origin")
			if origin != "" && originAllowed(origin, allowedOrigins) {
				w.Header().Set("Vary", "Origin")
				w.Header().Set("Access-Control-Allow-Origin", origin)
				w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
				w.Header().Set("Access-Control-Allow-Headers", "X-Referral-Code, Content-Type")
				w.Header().Set("Access-Control-Max-Age", "86400")
			}

			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusOK)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

func originAllowed(origin string, list []string) bool {
	for _, o := range list {
		if strings.EqualFold(o, origin) {
			return true
		}
	}
	return false
}
