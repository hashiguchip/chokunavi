package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/field"
)

// WorkCondition は労働条件の label/value ペア (例: 稼働 / 週20h)。
type WorkCondition struct {
	ent.Schema
}

func (WorkCondition) Fields() []ent.Field {
	return []ent.Field{
		field.String("label").NotEmpty(),
		field.String("value").NotEmpty(),
		field.Int("display_order").Default(0),
	}
}
