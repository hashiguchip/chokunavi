package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/field"
)

// Benefit は「できること」の 1 項目。
type Benefit struct {
	ent.Schema
}

func (Benefit) Fields() []ent.Field {
	return []ent.Field{
		field.String("title").NotEmpty(),
		field.Text("description").NotEmpty(),
		field.Int("display_order").Default(0),
	}
}
