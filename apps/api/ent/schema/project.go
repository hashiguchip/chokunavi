// Package schema は ent の domain 定義。各 entity を 1 ファイル 1 型で定義する。
package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
)

// Project は職務経歴 1 件分の entity。
//
// id は "project-1" のようなドメイン側で意味を持つ固定文字列なので、
// ent デフォルトの int 自動採番ではなく string PK にしている。
// period_start / period_end は postgres date 型に落とし、月初固定で扱う。
// period_end が NULL のレコードは「現在進行中」を意味する。
type Project struct {
	ent.Schema
}

func (Project) Fields() []ent.Field {
	return []ent.Field{
		field.String("id").
			NotEmpty().
			Immutable(),
		field.String("title").NotEmpty(),
		field.Time("period_start").
			SchemaType(map[string]string{"postgres": "date"}),
		field.Time("period_end").
			Optional().
			Nillable().
			SchemaType(map[string]string{"postgres": "date"}),
		field.String("team").NotEmpty(),
		field.String("role").NotEmpty(),
		field.Text("summary"),
	}
}

// Edges: Project ↔ Tech, Project ↔ Phase はいずれも many-to-many。
// 片方向 (Project から見た edge) のみ宣言し、ent が join table を生成する。
func (Project) Edges() []ent.Edge {
	return []ent.Edge{
		edge.To("techs", Tech.Type),
		edge.To("phases", Phase.Type),
	}
}
