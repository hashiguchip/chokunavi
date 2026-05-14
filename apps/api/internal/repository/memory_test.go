package repository_test

import (
	"context"
	"errors"
	"testing"

	"github.com/hashiguchip/chokunavi/apps/api/internal/appdata"
	"github.com/hashiguchip/chokunavi/apps/api/internal/repository"
)

func TestMemoryRepo(t *testing.T) {
	seed, err := appdata.ParseYAML([]byte(`
settings:
  available_from: "2026-01"
  work_hours: "週24h"
  contract_type: "業務委託"
  communication: "Slack"
  invoice_status: "対応可"
  x_profile_url: "https://x.com/example"
  x_post_url: "https://x.com/example/status/1"
  x_post_text: "hello"
projects:
  - id: older
    title: Older Project
    period_start: 2024-01-01T00:00:00Z
    team: "3名"
    role: "Backend"
    summary: "older"
    tech_ids: ["go"]
    phase_ids: ["development"]
    display_order: 2
  - id: newer
    title: Newer Project
    period_start: 2025-01-01T00:00:00Z
    period_end: 2025-06-01T00:00:00Z
    team: "4名"
    role: "Lead"
    summary: "newer"
    tech_ids: ["go", "react"]
    phase_ids: ["design"]
    display_order: 1
pricings:
  - label: standard
    rate: "100円/h"
    billing_hours: "140-180h"
    trial_rate: "90円/h"
    trial_note: "trial"
    patterns:
      - label: B
        trial_flex: 20
        trial_period: "2w"
        regular_flex: 30
        regular_period: "1m"
        display_order: 2
      - label: A
        trial_flex: 10
        trial_period: "1w"
        regular_flex: 20
        regular_period: "1m"
        display_order: 1
users:
  - label: active
    code: valid-code
    pricing_label: standard
  - label: revoked
    code: revoked-code
    pricing_label: standard
    revoked_at: 2026-01-01T00:00:00Z
`))
	if err != nil {
		t.Fatalf("ParseYAML: %v", err)
	}

	repo := repository.NewMemoryRepo(seed)
	user, err := repo.FindByCode(context.Background(), "valid-code")
	if err != nil {
		t.Fatalf("FindByCode(valid): %v", err)
	}

	got, err := repo.GetAppDataForUser(context.Background(), user.ID)
	if err != nil {
		t.Fatalf("GetAppDataForUser: %v", err)
	}
	if len(got.Projects) != 2 || got.Projects[0].ID != "newer" || got.Projects[1].ID != "older" {
		t.Fatalf("projects order = %+v", got.Projects)
	}
	if got.Pricing == nil || got.Pricing.Rate != "100円/h" {
		t.Fatalf("pricing = %+v", got.Pricing)
	}
	if len(got.Pricing.Patterns) != 2 || got.Pricing.Patterns[0].Label != "A" {
		t.Fatalf("pricing patterns = %+v", got.Pricing.Patterns)
	}
	if got.Settings == nil || got.Settings.XPostText != "hello" {
		t.Fatalf("settings = %+v", got.Settings)
	}
	got.Projects[0].TechIDs[0] = "mutated"
	got.Projects[0].PhaseIDs[0] = "mutated"
	got.Pricing.Patterns[0].Label = "mutated"

	gotAgain, err := repo.GetAppDataForUser(context.Background(), user.ID)
	if err != nil {
		t.Fatalf("GetAppDataForUser again: %v", err)
	}
	if gotAgain.Projects[0].TechIDs[0] == "mutated" || gotAgain.Projects[0].PhaseIDs[0] == "mutated" {
		t.Fatalf("projects were not deeply cloned: %+v", gotAgain.Projects[0])
	}
	if gotAgain.Pricing.Patterns[0].Label == "mutated" {
		t.Fatalf("pricing was not deeply cloned: %+v", gotAgain.Pricing.Patterns)
	}

	if _, err := repo.FindByCode(context.Background(), "revoked-code"); !errors.Is(err, repository.ErrUserNotFound) {
		t.Fatalf("FindByCode(revoked) err = %v, want ErrUserNotFound", err)
	}
	if _, err := repo.FindByCode(context.Background(), "missing-code"); !errors.Is(err, repository.ErrUserNotFound) {
		t.Fatalf("FindByCode(missing) err = %v, want ErrUserNotFound", err)
	}
}
