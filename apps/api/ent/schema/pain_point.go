package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/field"
)

// PainPoint は「お悩み」セクションの 1 項目。
type PainPoint struct {
	ent.Schema
}

func (PainPoint) Fields() []ent.Field {
	return []ent.Field{
		field.String("title").NotEmpty(),
		field.Text("description").NotEmpty(),
		field.Int("display_order").Default(0),
	}
}
