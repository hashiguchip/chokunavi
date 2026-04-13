// Package repository はチョクナビの appData 読み込み層を提供する。
//
// DB に置くのは Settings, User, Pricing, Project。
// Tech / Phase / FAQ / Benefit / Requirement / PainPoint は
// frontend の constants に直書きする。
package repository

import (
	"context"
	"time"
)

// Project は職務経歴の 1 件分 (誰が見ても同じ内容)。
//
// PeriodStart は月初固定の date。
// PeriodEnd は nil で「現在進行中」を表す。
// TechIDs / PhaseIDs は frontend constants/{tech,phases}.ts への参照 ID。
type Project struct {
	ID          string     `json:"id"`
	Title       string     `json:"title"`
	PeriodStart time.Time  `json:"periodStart"`
	PeriodEnd   *time.Time `json:"periodEnd,omitempty"`
	Team        string     `json:"team"`
	Role        string     `json:"role"`
	Summary     string     `json:"summary"`
	TechIDs     []string   `json:"techIds"`
	PhaseIDs    []string   `json:"phaseIds"`
}

type PricingPattern struct {
	Label         string `json:"label"`
	TrialFlex     int    `json:"trialFlex"`
	TrialPeriod   string `json:"trialPeriod"`
	RegularFlex   int    `json:"regularFlex"`
	RegularPeriod string `json:"regularPeriod"`
}

type Pricing struct {
	Rate         string           `json:"rate"`
	BillingHours string           `json:"billingHours"`
	TrialRate    string           `json:"trialRate"`
	TrialNote    string           `json:"trialNote"`
	Patterns     []PricingPattern `json:"patterns"`
}

// Settings はサイト全体の稼働条件 (single-row、全閲覧者に同じ値)。
type Settings struct {
	AvailableFrom string `json:"availableFrom"`
	WorkHours     string `json:"workHours"`
	ContractType  string `json:"contractType"`
	Communication string `json:"communication"`
	InvoiceStatus string `json:"invoiceStatus"`
}

// AppData は /api/app-data が返す aggregate response。
// User に紐づく Pricing、全 Projects、サイト全体の Settings を含む。
type AppData struct {
	Projects []Project `json:"projects"`
	Pricing  *Pricing  `json:"pricing,omitempty"`
	Settings *Settings `json:"settings,omitempty"`
}

// AppDataRepository は handler が依存する read interface。
// user ごとに pricing が違うため、handler 層で取り出した user ID を渡す。
type AppDataRepository interface {
	GetAppDataForUser(ctx context.Context, userID int) (*AppData, error)
}
