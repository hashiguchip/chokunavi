package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/field"
)

// Requirement は応募要件 1 行。
//
// kind = must_have / nice_to_have の enum で 2 種類を 1 テーブルに集約。
// API 側で kind ごとに groupBy して repository.Requirements 構造体に詰め直す。
type Requirement struct {
	ent.Schema
}

func (Requirement) Fields() []ent.Field {
	return []ent.Field{
		field.Enum("kind").
			Values("must_have", "nice_to_have"),
		field.Text("text").NotEmpty(),
		field.Int("display_order").Default(0),
	}
}
