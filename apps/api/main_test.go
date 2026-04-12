package main

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/hashiguchip/chokunavi/apps/api/internal/repository"
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

// stubRepo は in-memory な AppDataRepository 実装 (テスト専用)。
type stubRepo struct {
	appData *repository.AppData
}

func (s *stubRepo) GetAppDataForUser(_ context.Context, _ int) (*repository.AppData, error) {
	if s.appData == nil {
		return &repository.AppData{}, nil
	}
	return s.appData, nil
}

func setupServer(t *testing.T, repo repository.AppDataRepository) http.Handler {
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

func TestAppDataAuth(t *testing.T) {
	sampleAppData := &repository.AppData{
		Projects: []repository.Project{{ID: "p1", Title: "Sample"}},
		Pricing:  &repository.Pricing{Rate: "1円/h"},
	}

	t.Run("missing code", func(t *testing.T) {
		h := setupServer(t, &stubRepo{appData: sampleAppData})
		req := httptest.NewRequest(http.MethodGet, "/api/app-data", nil)
		w := httptest.NewRecorder()
		h.ServeHTTP(w, req)
		if w.Code != http.StatusUnauthorized {
			t.Fatalf("expected 401, got %d", w.Code)
		}
	})

	t.Run("invalid code", func(t *testing.T) {
		h := setupServer(t, &stubRepo{appData: sampleAppData})
		req := httptest.NewRequest(http.MethodGet, "/api/app-data", nil)
		req.Header.Set("X-Referral-Code", "wrong-code")
		w := httptest.NewRecorder()
		h.ServeHTTP(w, req)
		if w.Code != http.StatusUnauthorized {
			t.Fatalf("expected 401, got %d", w.Code)
		}
	})

	t.Run("valid code", func(t *testing.T) {
		h := setupServer(t, &stubRepo{appData: sampleAppData})
		req := httptest.NewRequest(http.MethodGet, "/api/app-data", nil)
		req.Header.Set("X-Referral-Code", testCode)
		w := httptest.NewRecorder()
		h.ServeHTTP(w, req)
		if w.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d (body=%s)", w.Code, w.Body.String())
		}

		var p repository.AppData
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
		noPricingAppData := &repository.AppData{
			Projects: []repository.Project{{ID: "p1", Title: "Sample"}},
		}
		h := setupServer(t, &stubRepo{appData: noPricingAppData})
		req := httptest.NewRequest(http.MethodGet, "/api/app-data", nil)
		req.Header.Set("X-Referral-Code", testCode)
		w := httptest.NewRecorder()
		h.ServeHTTP(w, req)
		if w.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d (body=%s)", w.Code, w.Body.String())
		}

		var p repository.AppData
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
		req := httptest.NewRequest(http.MethodOptions, "/api/app-data", nil)
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
		req := httptest.NewRequest(http.MethodOptions, "/api/app-data", nil)
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
