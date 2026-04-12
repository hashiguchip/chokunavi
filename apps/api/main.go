package main

import (
	"bytes"
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/danielgtaylor/huma/v2"
	"github.com/danielgtaylor/huma/v2/adapters/humago"

	"github.com/hashiguchip/chokunavi/apps/api/internal/handlers"
	"github.com/hashiguchip/chokunavi/apps/api/internal/middleware"
	"github.com/hashiguchip/chokunavi/apps/api/internal/repository"
)

type config struct {
	DatabaseURL string
	CORSOrigins []string
}

func loadConfig() *config {
	return &config{
		DatabaseURL: requireEnv("DATABASE_URL"),
		CORSOrigins: parseList(envOr("CORS_ORIGINS", "https://hashiguchip.github.io")),
	}
}

// newServer は config + repository から HTTP handler を組み立てる。
// repository を引数で受け取ることでテスト時に stub を差し込める (DI)。
//
// 順序: huma API + auth middleware → operation register → 全体を CORS でラップ。
// CORS は preflight (OPTIONS) を扱うため最外殻に置く。
func newServer(cfg *config, appDataRepo repository.AppDataRepository, userRepo repository.UserRepository) (http.Handler, error) {
	mux := http.NewServeMux()

	// huma DefaultConfig が以下を提供する:
	//   - /openapi.json と /openapi.yaml — live spec
	//   - /docs — Stoplight Elements の interactive API docs
	// commit された apps/api/openapi.yaml は review 用 contract (PR diff で
	// 契約変更が見える)。両者は同じ huma operation 定義から派生するので必ず一致する。
	humaConfig := huma.DefaultConfig("Resume 2026 API", "0.1.0")
	humaConfig.CreateHooks = nil

	api := humago.New(mux, humaConfig)
	api.UseMiddleware(middleware.Auth(api, userRepo))

	handlers.RegisterAll(api, appDataRepo)

	// huma に登録されていないパスは JSON 404 にフォールバック
	mux.HandleFunc("/", func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "not found"})
	})

	return middleware.CORS(cfg.CORSOrigins)(mux), nil
}

func main() {
	cfg := loadConfig()

	// 初期接続には 10s の timeout を付ける。Postgres が落ちていると process exit。
	initCtx, initCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer initCancel()
	client, _, closeFn, err := repository.OpenEntClient(initCtx, cfg.DatabaseURL)
	if err != nil {
		slog.Error("failed to init repository", "err", err)
		os.Exit(1)
	}
	defer closeFn()

	appDataRepo := repository.NewAppDataRepo(client)
	userRepo := repository.NewUserRepo(client)

	handler, err := newServer(cfg, appDataRepo, userRepo)
	if err != nil {
		slog.Error("failed to build server", "err", err)
		os.Exit(1)
	}

	port := envOr("PORT", "8080")
	srv := &http.Server{
		Addr:              ":" + port,
		Handler:           handler,
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

func parseList(s string) []string {
	var out []string
	for _, item := range strings.Split(s, ",") {
		item = strings.TrimSpace(item)
		if item != "" {
			out = append(out, item)
		}
	}
	return out
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	var buf bytes.Buffer
	if err := json.NewEncoder(&buf).Encode(v); err != nil {
		slog.Error("writeJSON encode failed", "err", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if _, err := w.Write(buf.Bytes()); err != nil {
		slog.Warn("writeJSON write failed", "err", err)
	}
}
