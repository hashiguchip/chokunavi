package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/field"
)

// Settings はサイト全体の稼働条件を保持する single-row テーブル。
// 全閲覧者に同じ値を返す (user 毎には分けない)。
type Settings struct {
	ent.Schema
}

func (Settings) Fields() []ent.Field {
	return []ent.Field{
		field.String("available_from").NotEmpty(),
		field.String("work_hours").NotEmpty(),
		field.String("contract_type").NotEmpty(),
		field.String("communication").NotEmpty(),
		field.String("invoice_status").NotEmpty(),
	}
}
