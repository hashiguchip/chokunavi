// Command seed は SOPS binary mode で暗号化された seed ファイルを復号して
// Postgres に投入する CLI。
//
// 使い方:
//
//	DATABASE_URL=postgres://... go run ./cmd/seed seed/app-data.sops.bin
//
// 環境変数:
//   - DATABASE_URL (必須): Postgres DSN
//   - SOPS_AGE_KEY_FILE: age private key の path (default は SOPS の探索順に従う)
//
// 動作:
//  1. SOPS binary mode で復号 (ファイル全体が単一暗号化 blob → 平文 YAML)
//  2. seedFile struct に Unmarshal、最低限の整合性を validate
//  3. TRUNCATE で全テーブルをクリア + シーケンスリセット (RESTART IDENTITY)
//  4. transaction を開始 → YAML の内容を insert (idempotent: 何度実行しても同じ結果)
//  5. commit
//
// seed は settings + projects + pricings + users を扱う。
// Tech / Phase / FAQ / Benefit / Requirement / PainPoint は
// frontend constants に直書きされており DB には載せない。
//
// 削除順序は FK 依存に従う:
//
//	users (pricing_id を参照)
//	  → pricing_patterns (pricing_id は ON DELETE SET NULL なので親より先)
//	  → pricings
//	projects (FK 無し)
//	settings (FK 無し)
package main

import (
	"bytes"
	"context"
	"fmt"
	"log/slog"
	"os"
	"os/exec"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"gopkg.in/yaml.v3"

	"github.com/hashiguchip/chokunavi/apps/api/ent"
	"github.com/hashiguchip/chokunavi/apps/api/internal/repository"
)

// seedFile は seed YAML (app-data.sops.bin を復号した平文) の root 構造。
//
// JSON tag ではなく yaml tag を付けること。snake_case で揃える。
//
// 日付フィールドは time.Time にしておく。yaml.v3 が `!!timestamp` (ISO date 等)
// を自動的に Go の time.Time に変換してくれるので、`2024-01-01` でも
// `2024-01-01T00:00:00Z` でも受け付けられる。
type seedFile struct {
	Settings seedSettings  `yaml:"settings"`
	Projects []seedProject `yaml:"projects"`
	Pricings []seedPricing `yaml:"pricings"`
	Users    []seedUser    `yaml:"users"`
}

// seedSettings はサイト全体の稼働条件 (single-row)。
type seedSettings struct {
	AvailableFrom string `yaml:"available_from"`
	WorkHours     string `yaml:"work_hours"`
	ContractType  string `yaml:"contract_type"`
	Communication string `yaml:"communication"`
	InvoiceStatus string `yaml:"invoice_status"`
}

// seedUser は users テーブル 1 行分。referral code は plaintext で保持する。
// pricing_label で pricings の中の 1 件を参照する (FK 整合性は validateSeed
// で pre-check し、insertAll で label → id に解決して SetPricingID する)。
type seedUser struct {
	Label        string     `yaml:"label"`
	Code         string     `yaml:"code"`
	PricingLabel *string    `yaml:"pricing_label"`
	RevokedAt    *time.Time `yaml:"revoked_at"`
}

type seedProject struct {
	ID           string     `yaml:"id"`
	Title        string     `yaml:"title"`
	PeriodStart  time.Time  `yaml:"period_start"`
	PeriodEnd    *time.Time `yaml:"period_end"` // nil = 現在進行中
	Team         string     `yaml:"team"`
	Role         string     `yaml:"role"`
	Summary      string     `yaml:"summary"`
	TechIDs      []string   `yaml:"tech_ids"`
	PhaseIDs     []string   `yaml:"phase_ids"`
	DisplayOrder int        `yaml:"display_order"`
}

type seedPricing struct {
	Label        string               `yaml:"label"`
	Rate         string               `yaml:"rate"`
	BillingHours string               `yaml:"billing_hours"`
	TrialRate    string               `yaml:"trial_rate"`
	TrialNote    string               `yaml:"trial_note"`
	Patterns     []seedPricingPattern `yaml:"patterns"`
}

type seedPricingPattern struct {
	Label         string `yaml:"label"`
	TrialFlex     int    `yaml:"trial_flex"`
	TrialPeriod   string `yaml:"trial_period"`
	RegularFlex   int    `yaml:"regular_flex"`
	RegularPeriod string `yaml:"regular_period"`
	DisplayOrder  int    `yaml:"display_order"`
}

func main() {
	if len(os.Args) != 2 {
		fmt.Fprintln(os.Stderr, "usage: seed <yaml-path>")
		os.Exit(2)
	}
	yamlPath := os.Args[1]

	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		slog.Error("DATABASE_URL must be set")
		os.Exit(1)
	}

	// 全工程を 60s 以内で完結させる context (sops 復号 + DB 操作)
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	// 1. SOPS binary mode で復号
	plaintext, err := decryptSeed(ctx, yamlPath)
	if err != nil {
		slog.Error("decrypt seed file", "path", yamlPath, "err", err)
		os.Exit(1)
	}

	// 2. Unmarshal
	var seed seedFile
	if err := yaml.Unmarshal(plaintext, &seed); err != nil {
		slog.Error("unmarshal seed yaml", "err", err)
		os.Exit(1)
	}

	// 3. validate (DB に当てる前に YAML 内整合性を確認)
	if err := validateSeed(&seed); err != nil {
		slog.Error("validate seed", "err", err)
		os.Exit(1)
	}

	// 4. ent client (pgxpool 経由) を構築
	client, pool, closeFn, err := repository.OpenEntClient(ctx, databaseURL)
	if err != nil {
		slog.Error("open ent client", "err", err)
		os.Exit(1)
	}
	defer closeFn()

	// 5. 単一 transaction で適用
	if err := applySeed(ctx, client, pool, &seed); err != nil {
		slog.Error("apply seed", "err", err)
		os.Exit(1)
	}

	slog.Info("seed applied",
		"settings", 1,
		"projects", len(seed.Projects),
		"pricings", len(seed.Pricings),
		"users", len(seed.Users),
	)
}

// decryptSeed は sops CLI (binary mode) に shell-out して seed ファイルを復号する。
//
// SOPS binary mode はファイル全体を単一の暗号化 blob として扱うため、
// YAML のキー名・配列長などの構造メタデータがリポジトリ上に漏れない。
// 復号結果は元の平文 YAML バイト列。
//
// SOPS の Go library (getsops/sops/v3/decrypt) を使わない理由:
// AWS/Azure/GCP/Vault などの key provider を全部 bundle するため indirect deps
// が ~100 増え、cmd/seed binary が ~65MB 太る。age 1 つしか使わないので
// shell-out が圧倒的に軽い。`sops` CLI は seed 編集にも必要なので、追加依存にはならない。
func decryptSeed(ctx context.Context, path string) ([]byte, error) {
	cmd := exec.CommandContext(ctx, "sops", "-d", "--input-type", "binary", "--output-type", "binary", path)
	var stderr bytes.Buffer
	cmd.Stderr = &stderr
	out, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("sops -d (binary) %s: %w (stderr: %s)", path, err, strings.TrimSpace(stderr.String()))
	}
	return out, nil
}

// validateSeed は DB アクセス前に YAML 内の整合性をチェックする。
//
//   - project の id が空でなく重複していない、period_start が指定されている
//   - pricing の label が空でなく重複していない
//   - user の label / code が空でなく重複していない
//   - user.pricing_label が pricings の中に存在する (FK 整合性 pre-check)
func validateSeed(s *seedFile) error {
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

	userLabels := make(map[string]struct{}, len(s.Users))
	userCodes := make(map[string]struct{}, len(s.Users))
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
	}
	return nil
}

// applySeed は全テーブルを TRUNCATE → 再投入する。
//
// TRUNCATE は DDL 扱いで ent の transaction 内では使えないため、
// pool から直接実行した後に ent tx で insert する。
func applySeed(ctx context.Context, client *ent.Client, pool *pgxpool.Pool, s *seedFile) error {
	// 1. TRUNCATE (DDL) — シーケンスも 1 にリセット
	const truncateQ = `TRUNCATE users, pricing_patterns, pricings, projects, settings RESTART IDENTITY CASCADE`
	if _, err := pool.Exec(ctx, truncateQ); err != nil {
		return fmt.Errorf("truncate: %w", err)
	}

	// 2. INSERT (ent tx)
	tx, err := client.Tx(ctx)
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	committed := false
	defer func() {
		if !committed {
			if rerr := tx.Rollback(); rerr != nil {
				slog.Warn("tx rollback failed", "err", rerr)
			}
		}
	}()

	if err := insertAll(ctx, tx, s); err != nil {
		return err
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("commit: %w", err)
	}
	committed = true
	return nil
}

// insertAll は YAML の内容を依存順に投入する。
//
// 1. Pricings を先に作って label → id の map を作る
// 2. PricingPatterns を親 pricing の id で insert
// 3. Projects は独立 (FK 無し)
// 4. Users を pricing_label → id 解決して insert
func insertAll(ctx context.Context, tx *ent.Tx, s *seedFile) error {
	// 0. Settings (FK 無し、先に投入)
	if _, err := tx.Settings.Create().
		SetAvailableFrom(s.Settings.AvailableFrom).
		SetWorkHours(s.Settings.WorkHours).
		SetContractType(s.Settings.ContractType).
		SetCommunication(s.Settings.Communication).
		SetInvoiceStatus(s.Settings.InvoiceStatus).
		Save(ctx); err != nil {
		return fmt.Errorf("create settings: %w", err)
	}

	pricingIDByLabel := make(map[string]int, len(s.Pricings))
	for _, p := range s.Pricings {
		row, err := tx.Pricing.Create().
			SetLabel(p.Label).
			SetRate(p.Rate).
			SetBillingHours(p.BillingHours).
			SetTrialRate(p.TrialRate).
			SetTrialNote(p.TrialNote).
			Save(ctx)
		if err != nil {
			return fmt.Errorf("create pricing %q: %w", p.Label, err)
		}
		pricingIDByLabel[p.Label] = row.ID

		for _, pat := range p.Patterns {
			if _, err := tx.PricingPattern.Create().
				SetLabel(pat.Label).
				SetTrialFlex(pat.TrialFlex).
				SetTrialPeriod(pat.TrialPeriod).
				SetRegularFlex(pat.RegularFlex).
				SetRegularPeriod(pat.RegularPeriod).
				SetDisplayOrder(pat.DisplayOrder).
				SetPricing(row).
				Save(ctx); err != nil {
				return fmt.Errorf("create pricing pattern %q (pricing=%q): %w", pat.Label, p.Label, err)
			}
		}
	}

	for _, p := range s.Projects {
		create := tx.Project.Create().
			SetID(p.ID).
			SetTitle(p.Title).
			SetPeriodStart(p.PeriodStart).
			SetTeam(p.Team).
			SetRole(p.Role).
			SetSummary(p.Summary).
			SetTechIds(p.TechIDs).
			SetPhaseIds(p.PhaseIDs).
			SetDisplayOrder(p.DisplayOrder)
		if p.PeriodEnd != nil {
			create.SetPeriodEnd(*p.PeriodEnd)
		}
		if _, err := create.Save(ctx); err != nil {
			return fmt.Errorf("create project %q: %w", p.ID, err)
		}
	}

	for _, u := range s.Users {
		create := tx.User.Create().
			SetLabel(u.Label).
			SetCode(u.Code)
		if u.PricingLabel != nil {
			create.SetPricingID(pricingIDByLabel[*u.PricingLabel])
		}
		if u.RevokedAt != nil {
			create.SetRevokedAt(*u.RevokedAt)
		}
		if _, err := create.Save(ctx); err != nil {
			return fmt.Errorf("create user %q: %w", u.Label, err)
		}
	}

	return nil
}
