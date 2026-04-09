package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
)

// Phase は工程フェーズ 1 件分。"requirements", "development" などの固定 id。
type Phase struct {
	ent.Schema
}

func (Phase) Fields() []ent.Field {
	return []ent.Field{
		field.String("id").
			NotEmpty().
			Immutable(),
		field.String("label").NotEmpty(),
		field.Int("display_order").Default(0),
	}
}

// Edges: Project ← Phase の back-reference。M:N にするための inverse 宣言。
func (Phase) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("projects", Project.Type).Ref("phases"),
	}
}
