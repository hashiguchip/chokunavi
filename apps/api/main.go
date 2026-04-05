package main

import (
	"context"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"
)

// buildMux creates the HTTP handler from environment variables.
func buildMux() http.Handler {
	origins := strings.Split(envOr("CORS_ORIGINS", "https://hashiguchip.github.io"), ",")

	hashes := requireEnv("AUTH_CODE_HASHES")
	var hashList []string
	for _, h := range strings.Split(hashes, ",") {
		h = strings.TrimSpace(h)
		if h != "" {
			hashList = append(hashList, h)
		}
	}
	if len(hashList) == 0 {
		slog.Error("AUTH_CODE_HASHES must contain at least one hash")
		os.Exit(1)
	}

	pricingRaw := requireEnv("PRICING_JSON")
	if !json.Valid([]byte(pricingRaw)) {
		slog.Error("PRICING_JSON is not valid JSON")
		os.Exit(1)
	}

	mux := http.NewServeMux()

	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})

	mux.HandleFunc("OPTIONS /api/pricing", func(w http.ResponseWriter, r *http.Request) {
		setCORS(w, r, origins)
		w.WriteHeader(http.StatusOK)
	})

	mux.HandleFunc("GET /api/pricing", func(w http.ResponseWriter, r *http.Request) {
		setCORS(w, r, origins)

		code := r.Header.Get("X-Referral-Code")
		if code == "" {
			writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "missing referral code"})
			return
		}

		sum := sha256.Sum256([]byte(code))
		hash := hex.EncodeToString(sum[:])
		if !matchHash(hash, hashList) {
			slog.Warn("auth failed")
			writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "invalid referral code"})
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		fmt.Fprint(w, pricingRaw)
	})

	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "not found"})
	})

	return mux
}

func main() {
	port := envOr("PORT", "8080")
	mux := buildMux()

	srv := &http.Server{
		Addr:              ":" + port,
		Handler:           mux,
		ReadHeaderTimeout: 2 * time.Second,
		ReadTimeout:       5 * time.Second,
		WriteTimeout:      10 * time.Second,
		IdleTimeout:       120 * time.Second,
	}

	go func() {
		slog.Info("server starting", "port", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("listen error", "err", err)
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGTERM, syscall.SIGINT)
	<-quit
	slog.Info("shutting down")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		slog.Error("shutdown error", "err", err)
	}
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func requireEnv(key string) string {
	v := os.Getenv(key)
	if v == "" {
		slog.Error("required env var is missing", "key", key)
		os.Exit(1)
	}
	return v
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func matchHash(hash string, allowed []string) bool {
	matched := false
	for _, a := range allowed {
		if subtle.ConstantTimeCompare([]byte(hash), []byte(a)) == 1 {
			matched = true
		}
	}
	return matched
}

func setCORS(w http.ResponseWriter, r *http.Request, origins []string) {
	w.Header().Set("Vary", "Origin")
	origin := r.Header.Get("Origin")
	for _, o := range origins {
		if strings.TrimSpace(o) == origin {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "X-Referral-Code, Content-Type")
			w.Header().Set("Access-Control-Max-Age", "86400")
			return
		}
	}
}
