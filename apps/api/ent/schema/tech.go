package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/dialect/entsql"
	"entgo.io/ent/schema"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
)

// Tech は使用技術 1 件分。"typescript" や "react" のような id を持つ。
type Tech struct {
	ent.Schema
}

// Annotations は ent デフォルト pluralizer ("tech" → "teches") を上書きして
// テーブル名を "techs" に固定する。
func (Tech) Annotations() []schema.Annotation {
	return []schema.Annotation{
		entsql.Annotation{Table: "techs"},
	}
}

func (Tech) Fields() []ent.Field {
	return []ent.Field{
		field.String("id").
			NotEmpty().
			Immutable(),
		field.String("label").NotEmpty(),
		field.String("category").NotEmpty(),
		// 表示順 (UI の category 内ソート用)。display_order の小さい順に並べる。
		field.Int("display_order").Default(0),
	}
}

// Edges: Project ← Tech の back-reference。
// Unique() を付けないことで M:N (join table 生成) になる。
// Tech 側から projects を引く query は使わないが、宣言しないと ent が
// 関係を 1:N と解釈して Tech 側に nullable FK 列を生やしてしまうため必須。
func (Tech) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("projects", Project.Type).Ref("techs"),
	}
}
