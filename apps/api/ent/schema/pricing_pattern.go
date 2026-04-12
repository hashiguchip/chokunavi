package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
)

// PricingPattern は料金プラン 1 件分。
//
// trial_flex / regular_flex は時間数 (整数)、period は表示用文字列 ("1ヶ月" 等)。
// pricing への back-reference は Unique() で 1 つの Pricing にのみ属する。
type PricingPattern struct {
	ent.Schema
}

func (PricingPattern) Fields() []ent.Field {
	return []ent.Field{
		field.String("label").NotEmpty(),
		field.Int("trial_flex"),
		field.String("trial_period"),
		field.Int("regular_flex"),
		field.String("regular_period").NotEmpty(),
		field.Int("display_order").Default(0),
	}
}

func (PricingPattern) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("pricing", Pricing.Type).
			Ref("patterns").
			Unique(),
	}
}
