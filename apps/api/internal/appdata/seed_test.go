package appdata_test

import (
	"encoding/base64"
	"strings"
	"testing"

	"github.com/hashiguchip/chokunavi/apps/api/internal/appdata"
)

const validYAML = `
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
  - id: sample
    title: Sample Project
    period_start: 2024-01-01T00:00:00Z
    team: "3名"
    role: "Backend"
    summary: "summary"
    tech_ids: ["go"]
    phase_ids: ["development"]
    display_order: 1
pricings:
  - label: standard
    rate: "100円/h"
    billing_hours: "140-180h"
    trial_rate: "90円/h"
    trial_note: "trial"
    patterns:
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
`

func TestParseBase64YAML(t *testing.T) {
	encoded := base64.StdEncoding.EncodeToString([]byte(validYAML))

	got, err := appdata.ParseBase64YAML(encoded)
	if err != nil {
		t.Fatalf("ParseBase64YAML: %v", err)
	}
	if len(got.Users) != 1 || got.Users[0].Code != "valid-code" {
		t.Fatalf("users = %+v", got.Users)
	}
}

func TestParseYAMLRejectsUnknownFields(t *testing.T) {
	raw := strings.Replace(validYAML, "available_from:", "available_form:", 1)

	if _, err := appdata.ParseYAML([]byte(raw)); err == nil {
		t.Fatal("ParseYAML succeeded with unknown field")
	}
}

func TestParseYAMLRejectsUnknownPricingLabel(t *testing.T) {
	raw := strings.Replace(validYAML, "pricing_label: standard", "pricing_label: missing", 1)

	if _, err := appdata.ParseYAML([]byte(raw)); err == nil {
		t.Fatal("ParseYAML succeeded with unknown pricing_label")
	}
}

func TestParseYAMLRejectsEmptyProjects(t *testing.T) {
	raw := strings.Replace(validYAML, `projects:
  - id: sample
    title: Sample Project
    period_start: 2024-01-01T00:00:00Z
    team: "3名"
    role: "Backend"
    summary: "summary"
    tech_ids: ["go"]
    phase_ids: ["development"]
    display_order: 1`, "projects: []", 1)

	if _, err := appdata.ParseYAML([]byte(raw)); err == nil {
		t.Fatal("ParseYAML succeeded with empty projects")
	}
}

func TestParseYAMLRejectsNoActiveUsers(t *testing.T) {
	raw := strings.Replace(validYAML, "pricing_label: standard", "pricing_label: standard\n    revoked_at: 2026-01-01T00:00:00Z", 1)

	if _, err := appdata.ParseYAML([]byte(raw)); err == nil {
		t.Fatal("ParseYAML succeeded with no active users")
	}
}
