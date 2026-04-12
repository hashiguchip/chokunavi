package middleware_test

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/danielgtaylor/huma/v2"
	"github.com/danielgtaylor/huma/v2/adapters/humago"

	"github.com/hashiguchip/chokunavi/apps/api/internal/middleware"
	"github.com/hashiguchip/chokunavi/apps/api/internal/repository"
)

// stubUserRepo は in-memory map で UserRepository を満たす。
type stubUserRepo struct {
	users map[string]*repository.User
}

func (s *stubUserRepo) FindByCode(_ context.Context, code string) (*repository.User, error) {
	u, ok := s.users[code]
	if !ok {
		return nil, repository.ErrUserNotFound
	}
	return u, nil
}

// gatedOutput は protected operation の response body。
// handler 側が context から user を取り出せていることも検証する。
type gatedOutput struct {
	Body struct {
		Label string `json:"label"`
	}
}

// buildHandler は middleware を Auth で組んだ huma API + 1 protected operation を返す。
func buildHandler(t *testing.T, repo repository.UserRepository) http.Handler {
	t.Helper()
	mux := http.NewServeMux()
	cfg := huma.DefaultConfig("test", "0.0.1")
	cfg.OpenAPIPath = ""
	cfg.DocsPath = ""
	cfg.SchemasPath = ""
	cfg.CreateHooks = nil

	api := humago.New(mux, cfg)
	api.UseMiddleware(middleware.Auth(api, repo))

	huma.Register(api, huma.Operation{
		OperationID: "gated",
		Method:      http.MethodGet,
		Path:        "/gated",
		Security:    []map[string][]string{{"referralCode": {}}},
	}, func(ctx context.Context, _ *struct{}) (*gatedOutput, error) {
		out := &gatedOutput{}
		if u, ok := middleware.UserFromContext(ctx); ok {
			out.Body.Label = u.Label
		}
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "open",
		Method:      http.MethodGet,
		Path:        "/open",
	}, func(_ context.Context, _ *struct{}) (*gatedOutput, error) {
		return &gatedOutput{}, nil
	})

	return mux
}

func TestAuthMissingHeader(t *testing.T) {
	h := buildHandler(t, &stubUserRepo{users: map[string]*repository.User{}})
	req := httptest.NewRequest(http.MethodGet, "/gated", nil)
	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)
	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", w.Code)
	}
}

func TestAuthInvalidCode(t *testing.T) {
	repo := &stubUserRepo{users: map[string]*repository.User{
		"valid": {ID: 1, Label: "alice", Code: "valid"},
	}}
	h := buildHandler(t, repo)
	req := httptest.NewRequest(http.MethodGet, "/gated", nil)
	req.Header.Set("X-Referral-Code", "wrong")
	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)
	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", w.Code)
	}
}

func TestAuthValidCodePropagatesUser(t *testing.T) {
	repo := &stubUserRepo{users: map[string]*repository.User{
		"valid": {ID: 1, Label: "alice", Code: "valid"},
	}}
	h := buildHandler(t, repo)
	req := httptest.NewRequest(http.MethodGet, "/gated", nil)
	req.Header.Set("X-Referral-Code", "valid")
	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d (body=%s)", w.Code, w.Body.String())
	}
	// handler が context から user を取れていれば label がレスポンスに乗る
	if got := w.Body.String(); !contains(got, `"label":"alice"`) {
		t.Errorf("expected body to contain user label, got %s", got)
	}
}

func TestAuthOpenOperationBypassed(t *testing.T) {
	// Security 無し operation は middleware が素通しすること
	h := buildHandler(t, &stubUserRepo{users: map[string]*repository.User{}})
	req := httptest.NewRequest(http.MethodGet, "/open", nil)
	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
}

func contains(s, sub string) bool {
	for i := 0; i+len(sub) <= len(s); i++ {
		if s[i:i+len(sub)] == sub {
			return true
		}
	}
	return false
}
