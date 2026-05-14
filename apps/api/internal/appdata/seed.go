// Package appdata owns the encrypted seed YAML schema used as the API data
// source. The decrypted data is loaded into an in-memory repository at startup.
package appdata

import (
	"bytes"
	"encoding/base64"
	"fmt"
	"io"
	"net/url"
	"strings"
	"time"

	"gopkg.in/yaml.v3"
)

// File is the root structure of the decrypted app-data YAML.
type File struct {
	Settings Settings  `yaml:"settings"`
	Projects []Project `yaml:"projects"`
	Pricings []Pricing `yaml:"pricings"`
	Users    []User    `yaml:"users"`
}

// Settings contains site-wide availability and contact values.
type Settings struct {
	AvailableFrom string `yaml:"available_from"`
	WorkHours     string `yaml:"work_hours"`
	ContractType  string `yaml:"contract_type"`
	Communication string `yaml:"communication"`
	InvoiceStatus string `yaml:"invoice_status"`
	XProfileURL   string `yaml:"x_profile_url"`
	XPostURL      string `yaml:"x_post_url"`
	XPostText     string `yaml:"x_post_text"`
}

// User contains referral-code metadata. PricingLabel points at a Pricing label.
type User struct {
	Label        string     `yaml:"label"`
	Code         string     `yaml:"code"`
	PricingLabel *string    `yaml:"pricing_label"`
	RevokedAt    *time.Time `yaml:"revoked_at"`
}

// Project is one resume project entry.
type Project struct {
	ID           string     `yaml:"id"`
	Title        string     `yaml:"title"`
	PeriodStart  time.Time  `yaml:"period_start"`
	PeriodEnd    *time.Time `yaml:"period_end"`
	Team         string     `yaml:"team"`
	Role         string     `yaml:"role"`
	Summary      string     `yaml:"summary"`
	TechIDs      []string   `yaml:"tech_ids"`
	PhaseIDs     []string   `yaml:"phase_ids"`
	DisplayOrder int        `yaml:"display_order"`
}

// Pricing is one pricing plan that can be associated with many users.
type Pricing struct {
	Label        string           `yaml:"label"`
	Rate         string           `yaml:"rate"`
	BillingHours string           `yaml:"billing_hours"`
	TrialRate    string           `yaml:"trial_rate"`
	TrialNote    string           `yaml:"trial_note"`
	Patterns     []PricingPattern `yaml:"patterns"`
}

// PricingPattern is one presentation row inside a pricing plan.
type PricingPattern struct {
	Label         string `yaml:"label"`
	TrialFlex     int    `yaml:"trial_flex"`
	TrialPeriod   string `yaml:"trial_period"`
	RegularFlex   int    `yaml:"regular_flex"`
	RegularPeriod string `yaml:"regular_period"`
	DisplayOrder  int    `yaml:"display_order"`
}

// ParseYAML parses and validates decrypted app-data YAML.
func ParseYAML(raw []byte) (*File, error) {
	var seed File
	decoder := yaml.NewDecoder(bytes.NewReader(raw))
	decoder.KnownFields(true)
	if err := decoder.Decode(&seed); err != nil {
		return nil, fmt.Errorf("unmarshal app data yaml: %w", err)
	}
	if err := Validate(&seed); err != nil {
		return nil, err
	}
	return &seed, nil
}

// ParseBase64YAML decodes base64 encoded YAML and validates it.
func ParseBase64YAML(encoded string) (*File, error) {
	decoder := base64.NewDecoder(base64.StdEncoding, strings.NewReader(encoded))
	raw, err := io.ReadAll(decoder)
	if err != nil {
		return nil, fmt.Errorf("decode app data yaml base64: %w", err)
	}
	return ParseYAML(raw)
}

// Validate checks YAML-local consistency before the data is exposed by the API.
func Validate(s *File) error {
	for _, kv := range []struct{ k, v string }{
		{"available_from", s.Settings.AvailableFrom},
		{"work_hours", s.Settings.WorkHours},
		{"contract_type", s.Settings.ContractType},
		{"communication", s.Settings.Communication},
		{"invoice_status", s.Settings.InvoiceStatus},
	} {
		if kv.v == "" {
			return fmt.Errorf("settings: empty %s", kv.k)
		}
	}
	for _, kv := range []struct{ k, v string }{
		{"x_profile_url", s.Settings.XProfileURL},
		{"x_post_url", s.Settings.XPostURL},
	} {
		if err := validateXURL(kv.v); err != nil {
			return fmt.Errorf("settings: invalid %s: %w", kv.k, err)
		}
	}

	if len(s.Projects) == 0 {
		return fmt.Errorf("projects: at least one project is required")
	}
	projectIDs := make(map[string]struct{}, len(s.Projects))
	for _, p := range s.Projects {
		if p.ID == "" {
			return fmt.Errorf("project: empty id")
		}
		if _, dup := projectIDs[p.ID]; dup {
			return fmt.Errorf("project: duplicate id %q", p.ID)
		}
		projectIDs[p.ID] = struct{}{}
		if p.PeriodStart.IsZero() {
			return fmt.Errorf("project %q: missing period_start", p.ID)
		}
	}

	pricingLabels := make(map[string]struct{}, len(s.Pricings))
	for _, p := range s.Pricings {
		if p.Label == "" {
			return fmt.Errorf("pricing: empty label")
		}
		if _, dup := pricingLabels[p.Label]; dup {
			return fmt.Errorf("pricing: duplicate label %q", p.Label)
		}
		pricingLabels[p.Label] = struct{}{}
	}

	if len(s.Users) == 0 {
		return fmt.Errorf("users: at least one user is required")
	}
	userLabels := make(map[string]struct{}, len(s.Users))
	userCodes := make(map[string]struct{}, len(s.Users))
	activeUsers := 0
	for _, u := range s.Users {
		if u.Label == "" {
			return fmt.Errorf("user: empty label")
		}
		if u.Code == "" {
			return fmt.Errorf("user %q: empty code", u.Label)
		}
		if _, dup := userLabels[u.Label]; dup {
			return fmt.Errorf("user: duplicate label %q", u.Label)
		}
		if _, dup := userCodes[u.Code]; dup {
			return fmt.Errorf("user: duplicate code (label %q)", u.Label)
		}
		userLabels[u.Label] = struct{}{}
		userCodes[u.Code] = struct{}{}
		if u.PricingLabel != nil {
			if *u.PricingLabel == "" {
				return fmt.Errorf("user %q: pricing_label must be null or a valid label, got empty string", u.Label)
			}
			if _, ok := pricingLabels[*u.PricingLabel]; !ok {
				return fmt.Errorf("user %q: unknown pricing_label %q", u.Label, *u.PricingLabel)
			}
		}
		if u.RevokedAt == nil {
			activeUsers++
		}
	}
	if activeUsers == 0 {
		return fmt.Errorf("users: at least one active user is required")
	}
	return nil
}

func validateXURL(v string) error {
	if v == "" {
		return nil
	}
	u, err := url.Parse(v)
	if err != nil {
		return err
	}
	host := strings.ToLower(u.Hostname())
	if u.Scheme != "https" {
		return fmt.Errorf("scheme must be https")
	}
	switch host {
	case "x.com", "www.x.com", "twitter.com", "www.twitter.com":
		return nil
	default:
		return fmt.Errorf("host must be x.com or twitter.com")
	}
}
