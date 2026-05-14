package repository

import (
	"context"
	"fmt"
	"sort"

	"github.com/hashiguchip/chokunavi/apps/api/internal/appdata"
)

// MemoryRepo serves app data from a validated in-memory seed file.
type MemoryRepo struct {
	settings      *Settings
	projects      []Project
	usersByCode   map[string]memoryUser
	usersByID     map[int]memoryUser
	pricingByName map[string]Pricing
}

type memoryUser struct {
	User
	PricingLabel *string
}

// NewMemoryRepo builds read-only indexes from the seed data loaded at process
// startup. The returned repo is safe for concurrent readers.
func NewMemoryRepo(seed *appdata.File) *MemoryRepo {
	settings := settingsFromSeed(seed.Settings)

	seedProjects := append([]appdata.Project(nil), seed.Projects...)
	sort.SliceStable(seedProjects, func(i, j int) bool {
		if seedProjects[i].DisplayOrder == seedProjects[j].DisplayOrder {
			return seedProjects[i].ID < seedProjects[j].ID
		}
		return seedProjects[i].DisplayOrder < seedProjects[j].DisplayOrder
	})
	projects := make([]Project, 0, len(seed.Projects))
	for _, p := range seedProjects {
		projects = append(projects, projectFromSeed(p))
	}

	pricingByName := make(map[string]Pricing, len(seed.Pricings))
	for _, p := range seed.Pricings {
		pricingByName[p.Label] = pricingFromSeed(p)
	}

	usersByCode := make(map[string]memoryUser, len(seed.Users))
	usersByID := make(map[int]memoryUser, len(seed.Users))
	for i, u := range seed.Users {
		user := memoryUser{
			User: User{
				ID:        i + 1,
				Label:     u.Label,
				Code:      u.Code,
				RevokedAt: u.RevokedAt,
			},
			PricingLabel: u.PricingLabel,
		}
		usersByCode[u.Code] = user
		usersByID[user.ID] = user
	}

	return &MemoryRepo{
		settings:      &settings,
		projects:      projects,
		usersByCode:   usersByCode,
		usersByID:     usersByID,
		pricingByName: pricingByName,
	}
}

// FindByCode returns the active user matching a referral code.
func (r *MemoryRepo) FindByCode(_ context.Context, code string) (*User, error) {
	user, ok := r.usersByCode[code]
	if !ok || user.RevokedAt != nil {
		return nil, ErrUserNotFound
	}
	u := user.User
	return &u, nil
}

// GetAppDataForUser returns public app data plus the pricing plan associated
// with the authenticated user. It never exposes users or unrelated pricings.
func (r *MemoryRepo) GetAppDataForUser(_ context.Context, userID int) (*AppData, error) {
	matched, ok := r.usersByID[userID]
	if !ok || matched.RevokedAt != nil {
		return nil, ErrUserNotFound
	}

	out := &AppData{
		Projects: cloneProjects(r.projects),
		Settings: cloneSettings(r.settings),
	}
	if matched.PricingLabel != nil {
		pricing, ok := r.pricingByName[*matched.PricingLabel]
		if !ok {
			return nil, fmt.Errorf("pricing %q not found for user %q", *matched.PricingLabel, matched.Label)
		}
		out.Pricing = clonePricing(&pricing)
	}
	return out, nil
}

func settingsFromSeed(in appdata.Settings) Settings {
	return Settings{
		AvailableFrom: in.AvailableFrom,
		WorkHours:     in.WorkHours,
		ContractType:  in.ContractType,
		Communication: in.Communication,
		InvoiceStatus: in.InvoiceStatus,
		XProfileURL:   in.XProfileURL,
		XPostURL:      in.XPostURL,
		XPostText:     in.XPostText,
	}
}

func projectFromSeed(in appdata.Project) Project {
	return Project{
		ID:          in.ID,
		Title:       in.Title,
		PeriodStart: in.PeriodStart,
		PeriodEnd:   in.PeriodEnd,
		Team:        in.Team,
		Role:        in.Role,
		Summary:     in.Summary,
		TechIDs:     append([]string(nil), in.TechIDs...),
		PhaseIDs:    append([]string(nil), in.PhaseIDs...),
	}
}

func pricingFromSeed(in appdata.Pricing) Pricing {
	seedPatterns := append([]appdata.PricingPattern(nil), in.Patterns...)
	sort.SliceStable(seedPatterns, func(i, j int) bool {
		if seedPatterns[i].DisplayOrder == seedPatterns[j].DisplayOrder {
			return seedPatterns[i].Label < seedPatterns[j].Label
		}
		return seedPatterns[i].DisplayOrder < seedPatterns[j].DisplayOrder
	})

	patterns := make([]PricingPattern, 0, len(seedPatterns))
	for _, pat := range seedPatterns {
		patterns = append(patterns, PricingPattern{
			Label:         pat.Label,
			TrialFlex:     pat.TrialFlex,
			TrialPeriod:   pat.TrialPeriod,
			RegularFlex:   pat.RegularFlex,
			RegularPeriod: pat.RegularPeriod,
		})
	}

	return Pricing{
		Rate:         in.Rate,
		BillingHours: in.BillingHours,
		TrialRate:    in.TrialRate,
		TrialNote:    in.TrialNote,
		Patterns:     patterns,
	}
}

func cloneSettings(in *Settings) *Settings {
	if in == nil {
		return nil
	}
	out := *in
	return &out
}

func cloneProjects(in []Project) []Project {
	out := make([]Project, len(in))
	for i, p := range in {
		out[i] = p
		out[i].TechIDs = append([]string(nil), p.TechIDs...)
		out[i].PhaseIDs = append([]string(nil), p.PhaseIDs...)
	}
	return out
}

func clonePricing(in *Pricing) *Pricing {
	if in == nil {
		return nil
	}
	out := *in
	out.Patterns = append([]PricingPattern(nil), in.Patterns...)
	return &out
}
