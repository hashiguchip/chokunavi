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

	"github.com/hashiguchip/resume_2026/apps/api/internal/handlers"
	"github.com/hashiguchip/resume_2026/apps/api/internal/middleware"
	"github.com/hashiguchip/resume_2026/apps/api/internal/repository"
)

type config struct {
	DatabaseURL string
	AuthHashes  []string
	CORSOrigins []string
}

func loadConfig() *config {
	hashes := parseList(requireEnv("AUTH_CODE_HASHES"))
	if len(hashes) == 0 {
		slog.Error("AUTH_CODE_HASHES must contain at least one hash")
		os.Exit(1)
	}

	return &config{
		DatabaseURL: requireEnv("DATABASE_URL"),
		AuthHashes:  hashes,
		CORSOrigins: parseList(envOr("CORS_ORIGINS", "https://hashiguchip.github.io")),
	}
}

type healthOutput struct {
	Body struct {
		Status string `json:"status" example:"ok" doc:"Service status"`
	}
}

// newServer は config + repository から HTTP handler を組み立てる。
// repository を引数で受け取ることでテスト時に stub を差し込める (DI)。
//
// 順序: huma API + auth middleware → operation register → 全体を CORS でラップ。
// CORS は preflight (OPTIONS) を扱うため最外殻に置く。
func newServer(cfg *config, repo repository.PortfolioRepository) (http.Handler, error) {
	mux := http.NewServeMux()

	humaConfig := huma.DefaultConfig("Resume 2026 API", "0.1.0")
	// OpenAPI / docs endpoint は今は露出しない (PR 3 で再有効化予定)
	humaConfig.OpenAPIPath = ""
	humaConfig.DocsPath = ""
	humaConfig.SchemasPath = ""
	humaConfig.CreateHooks = nil

	api := humago.New(mux, humaConfig)
	api.UseMiddleware(middleware.Auth(api, cfg.AuthHashes))

	huma.Register(api, huma.Operation{
		OperationID: "healthz",
		Method:      http.MethodGet,
		Path:        "/healthz",
		Summary:     "Liveness probe",
	}, func(_ context.Context, _ *struct{}) (*healthOutput, error) {
		out := &healthOutput{}
		out.Body.Status = "ok"
		return out, nil
	})

	handlers.RegisterPortfolio(api, repo)

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
	repo, err := repository.NewPostgres(initCtx, cfg.DatabaseURL)
	if err != nil {
		slog.Error("failed to init repository", "err", err)
		os.Exit(1)
	}
	defer func() {
		if err := repo.Close(); err != nil {
			slog.Error("repo close", "err", err)
		}
	}()

	handler, err := newServer(cfg, repo)
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
