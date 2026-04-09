// Package repository は portfolio データの読み込み層を提供する。
//
// データ件数 (~100) が少なく、書き込みも無いため、起動時に backing store
// から 1 回読み込んで in-memory cache に保持する設計を想定している。
// 実装は backing store ごとに別ファイル (e.g. postgres.go) に置く。
package repository

import (
	"context"
	"time"
)

// Project は職務経歴の 1 件分。
//
// PeriodStart は月初固定の date。
// PeriodEnd は nil で「現在進行中」を表す。
// 表示用 ("2022年8月〜2026年3月（3年8ヶ月）") の整形は frontend 側で行う。
type Project struct {
	ID          string     `json:"id"`
	Title       string     `json:"title"`
	PeriodStart time.Time  `json:"periodStart"`
	PeriodEnd   *time.Time `json:"periodEnd,omitempty"`
	Team        string     `json:"team"`
	Role        string     `json:"role"`
	TechIDs     []string   `json:"techIds"`
	PhaseIDs    []string   `json:"phaseIds"`
	Summary     string     `json:"summary"`
}

type Tech struct {
	ID       string `json:"id"`
	Label    string `json:"label"`
	Category string `json:"category"`
}

type Phase struct {
	ID    string `json:"id"`
	Label string `json:"label"`
}

type FAQItem struct {
	Q string `json:"q"`
	A string `json:"a"`
}

type Benefit struct {
	Title       string `json:"title"`
	Description string `json:"description"`
}

type Requirements struct {
	MustHave   []string `json:"mustHave"`
	NiceToHave []string `json:"niceToHave"`
}

type WorkCondition struct {
	Label string `json:"label"`
	Value string `json:"value"`
}

type PainPoint struct {
	Title       string `json:"title"`
	Description string `json:"description"`
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

// Portfolio は /api/portfolio が返す aggregate response。
// Project.TechIDs / PhaseIDs は ID のまま返し、ラベル解決はクライアント側で行う。
type Portfolio struct {
	Projects       []Project       `json:"projects"`
	Techs          []Tech          `json:"techs"`
	Phases         []Phase         `json:"phases"`
	FAQ            []FAQItem       `json:"faq"`
	Benefits       []Benefit       `json:"benefits"`
	Requirements   Requirements    `json:"requirements"`
	WorkConditions []WorkCondition `json:"workConditions"`
	PainPoints     []PainPoint     `json:"painPoints"`
	Pricing        Pricing         `json:"pricing"`
}

// PortfolioRepository は handler が依存する read interface。
// テスト差し替えと backing store 差し替え (e.g. ent + Postgres) のために抽象化している。
type PortfolioRepository interface {
	GetPortfolio(ctx context.Context) (*Portfolio, error)
}
