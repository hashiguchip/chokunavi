package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
)

// Pricing は料金テーブルの singleton。実質 1 行のみ存在する想定。
//
// 「単一行 vs 複数行」を schema レベルで縛らない (CHECK 制約等で縛っても
// migration が複雑になるだけ)。GetPortfolio 側で First を取る。
type Pricing struct {
	ent.Schema
}

func (Pricing) Fields() []ent.Field {
	return []ent.Field{
		field.String("rate").NotEmpty(),
		field.String("billing_hours").NotEmpty(),
		field.String("trial_rate").NotEmpty(),
		field.String("trial_note"),
	}
}

// Pricing → PricingPattern の 1:N。pattern 側に外部キー pricing_id を持たせる。
// StorageKey で column 名を明示しないと ent デフォルトで "pricing_patterns" に
// なってしまい (テーブル名と同名で見にくい)、可読性が落ちる。
func (Pricing) Edges() []ent.Edge {
	return []ent.Edge{
		edge.To("patterns", PricingPattern.Type).
			StorageKey(edge.Column("pricing_id")),
	}
}
