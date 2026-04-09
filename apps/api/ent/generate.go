// Package ent は ent generate で client コードが書き出される配置先。
//
// `mise run ent:generate` を実行すると schema/ 以下を読み取って ent/ 配下に
// client.go や mutation.go などが生成される。
//
// sql/versioned-migration feature を有効化することで、生成された
// migrate package に NamedDiff など atlas 互換の migration 生成 API が出る。
//
// `go tool ent` は go.mod の `tool entgo.io/ent/cmd/ent` ディレクティブで
// 解決される。CLI のバージョンとその transitive deps が go.sum で固定される
// ため、`go run -mod=mod` 方式で起こる依存解決の不安定 (clipperhouse/
// displaywidth の API 不整合など) を回避する。
package ent

//go:generate go tool ent generate --feature sql/versioned-migration ./schema
