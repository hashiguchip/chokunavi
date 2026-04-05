package main

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

const (
	// echo -n "test" | shasum -a 256
	testHash = "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08"
	testJSON = `{"rate":"1円/h","billingHours":"実稼働","trialRate":"1円/h","trialNote":"お試し","patterns":[]}`
)

func setupMux(t *testing.T) http.Handler {
	t.Helper()
	t.Setenv("AUTH_CODE_HASHES", testHash)
	t.Setenv("PRICING_JSON", testJSON)
	t.Setenv("CORS_ORIGINS", "http://localhost:3000")

	// Re-create the mux with the current env (mirrors main() setup)
	return buildMux()
}

func TestHealthz(t *testing.T) {
	mux := setupMux(t)
	req := httptest.NewRequest("GET", "/healthz", nil)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
	if ct := w.Header().Get("Content-Type"); ct != "application/json" {
		t.Fatalf("expected application/json, got %s", ct)
	}
}

func TestPricingAuth(t *testing.T) {
	mux := setupMux(t)

	t.Run("missing code", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/pricing", nil)
		w := httptest.NewRecorder()
		mux.ServeHTTP(w, req)
		if w.Code != http.StatusUnauthorized {
			t.Fatalf("expected 401, got %d", w.Code)
		}
	})

	t.Run("invalid code", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/pricing", nil)
		req.Header.Set("X-Referral-Code", "wrong-code")
		w := httptest.NewRecorder()
		mux.ServeHTTP(w, req)
		if w.Code != http.StatusUnauthorized {
			t.Fatalf("expected 401, got %d", w.Code)
		}
	})

	t.Run("valid code", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/pricing", nil)
		req.Header.Set("X-Referral-Code", "test")
		w := httptest.NewRecorder()
		mux.ServeHTTP(w, req)
		if w.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", w.Code)
		}
		if w.Body.String() != testJSON {
			t.Fatalf("unexpected body: %s", w.Body.String())
		}
	})
}

func TestCORS(t *testing.T) {
	mux := setupMux(t)

	t.Run("preflight", func(t *testing.T) {
		req := httptest.NewRequest("OPTIONS", "/api/pricing", nil)
		req.Header.Set("Origin", "http://localhost:3000")
		w := httptest.NewRecorder()
		mux.ServeHTTP(w, req)
		if w.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", w.Code)
		}
		if w.Header().Get("Access-Control-Allow-Origin") != "http://localhost:3000" {
			t.Fatal("missing CORS origin header")
		}
	})

	t.Run("disallowed origin", func(t *testing.T) {
		req := httptest.NewRequest("OPTIONS", "/api/pricing", nil)
		req.Header.Set("Origin", "http://evil.com")
		w := httptest.NewRecorder()
		mux.ServeHTTP(w, req)
		if w.Header().Get("Access-Control-Allow-Origin") != "" {
			t.Fatal("should not set CORS header for disallowed origin")
		}
	})
}

func TestNotFound(t *testing.T) {
	mux := setupMux(t)
	req := httptest.NewRequest("GET", "/unknown", nil)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)
	if w.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", w.Code)
	}
	if ct := w.Header().Get("Content-Type"); ct != "application/json" {
		t.Fatalf("expected application/json, got %s", ct)
	}
}
