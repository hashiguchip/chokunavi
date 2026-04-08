package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/field"
)

// FAQItem は Q/A 1 件分。display_order で表示順を制御する。
// id はドメインで意味を持たないので ent デフォルトの int 自動採番でよい。
type FAQItem struct {
	ent.Schema
}

func (FAQItem) Fields() []ent.Field {
	return []ent.Field{
		field.String("question").NotEmpty(),
		field.Text("answer").NotEmpty(),
		field.Int("display_order").Default(0),
	}
}
