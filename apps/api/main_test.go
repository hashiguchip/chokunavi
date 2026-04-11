package main

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/hashiguchip/resume_2026/apps/api/internal/repository"
)

const testCode = "test"

// stubUserRepo は in-memory な UserRepository 実装。
// testCode のみを valid として受け付ける。
type stubUserRepo struct{}

func (stubUserRepo) FindByCode(_ context.Context, code string) (*repository.User, error) {
	if code == testCode {
		return &repository.User{ID: 1, Label: "test", Code: code}, nil
	}
	return nil, repository.ErrUserNotFound
}

// stubRepo は in-memory な PortfolioRepository 実装 (テスト専用)。
type stubRepo struct {
	portfolio *repository.Portfolio
}

func (s *stubRepo) GetPortfolioForUser(_ context.Context, _ int) (*repository.Portfolio, error) {
	if s.portfolio == nil {
		return &repository.Portfolio{}, nil
	}
	return s.portfolio, nil
}

func setupServer(t *testing.T, repo repository.PortfolioRepository) http.Handler {
	t.Helper()
	if repo == nil {
		repo = &stubRepo{}
	}
	cfg := &config{
		CORSOrigins: []string{"http://localhost:3000"},
	}
	h, err := newServer(cfg, repo, stubUserRepo{})
	if err != nil {
		t.Fatalf("newServer: %v", err)
	}
	return h
}

func TestHealthz(t *testing.T) {
	h := setupServer(t, nil)
	req := httptest.NewRequest(http.MethodGet, "/healthz", nil)
	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
	if ct := w.Header().Get("Content-Type"); ct != "application/json" {
		t.Fatalf("expected application/json, got %s", ct)
	}
}

func TestPortfolioAuth(t *testing.T) {
	samplePortfolio := &repository.Portfolio{
		Projects: []repository.Project{{ID: "p1", Title: "Sample"}},
		Pricing:  &repository.Pricing{Rate: "1円/h"},
	}

	t.Run("missing code", func(t *testing.T) {
		h := setupServer(t, &stubRepo{portfolio: samplePortfolio})
		req := httptest.NewRequest(http.MethodGet, "/api/portfolio", nil)
		w := httptest.NewRecorder()
		h.ServeHTTP(w, req)
		if w.Code != http.StatusUnauthorized {
			t.Fatalf("expected 401, got %d", w.Code)
		}
	})

	t.Run("invalid code", func(t *testing.T) {
		h := setupServer(t, &stubRepo{portfolio: samplePortfolio})
		req := httptest.NewRequest(http.MethodGet, "/api/portfolio", nil)
		req.Header.Set("X-Referral-Code", "wrong-code")
		w := httptest.NewRecorder()
		h.ServeHTTP(w, req)
		if w.Code != http.StatusUnauthorized {
			t.Fatalf("expected 401, got %d", w.Code)
		}
	})

	t.Run("valid code", func(t *testing.T) {
		h := setupServer(t, &stubRepo{portfolio: samplePortfolio})
		req := httptest.NewRequest(http.MethodGet, "/api/portfolio", nil)
		req.Header.Set("X-Referral-Code", testCode)
		w := httptest.NewRecorder()
		h.ServeHTTP(w, req)
		if w.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d (body=%s)", w.Code, w.Body.String())
		}

		var p repository.Portfolio
		if err := json.Unmarshal(w.Body.Bytes(), &p); err != nil {
			t.Fatalf("decode body: %v", err)
		}
		if len(p.Projects) == 0 {
			t.Fatal("expected projects to be populated")
		}
		if p.Pricing == nil {
			t.Fatal("expected pricing to be non-nil")
		}
		if p.Pricing.Rate == "" {
			t.Fatal("expected pricing.rate to be populated")
		}
	})

	t.Run("valid code without pricing", func(t *testing.T) {
		noPricingPortfolio := &repository.Portfolio{
			Projects: []repository.Project{{ID: "p1", Title: "Sample"}},
		}
		h := setupServer(t, &stubRepo{portfolio: noPricingPortfolio})
		req := httptest.NewRequest(http.MethodGet, "/api/portfolio", nil)
		req.Header.Set("X-Referral-Code", testCode)
		w := httptest.NewRecorder()
		h.ServeHTTP(w, req)
		if w.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d (body=%s)", w.Code, w.Body.String())
		}

		var p repository.Portfolio
		if err := json.Unmarshal(w.Body.Bytes(), &p); err != nil {
			t.Fatalf("decode body: %v", err)
		}
		if p.Pricing != nil {
			t.Fatalf("expected pricing to be nil, got %+v", p.Pricing)
		}
	})
}

func TestCORS(t *testing.T) {
	t.Run("preflight allowed", func(t *testing.T) {
		h := setupServer(t, nil)
		req := httptest.NewRequest(http.MethodOptions, "/api/portfolio", nil)
		req.Header.Set("Origin", "http://localhost:3000")
		req.Header.Set("Access-Control-Request-Method", http.MethodGet)
		w := httptest.NewRecorder()
		h.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", w.Code)
		}
		if got := w.Header().Get("Access-Control-Allow-Origin"); got != "http://localhost:3000" {
			t.Fatalf("expected Allow-Origin=http://localhost:3000, got %q", got)
		}
		if got := w.Header().Get("Access-Control-Allow-Headers"); got == "" {
			t.Fatal("expected Allow-Headers to be set")
		}
	})

	t.Run("preflight disallowed origin", func(t *testing.T) {
		h := setupServer(t, nil)
		req := httptest.NewRequest(http.MethodOptions, "/api/portfolio", nil)
		req.Header.Set("Origin", "http://evil.example.com")
		req.Header.Set("Access-Control-Request-Method", http.MethodGet)
		w := httptest.NewRecorder()
		h.ServeHTTP(w, req)

		if got := w.Header().Get("Access-Control-Allow-Origin"); got != "" {
			t.Fatalf("expected no Allow-Origin, got %q", got)
		}
	})
}

func TestNotFound(t *testing.T) {
	h := setupServer(t, nil)
	req := httptest.NewRequest(http.MethodGet, "/unknown", nil)
	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)
	if w.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", w.Code)
	}
	if ct := w.Header().Get("Content-Type"); ct != "application/json" {
		t.Fatalf("expected application/json, got %s", ct)
	}
}
