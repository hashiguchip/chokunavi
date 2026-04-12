// Command openapi は huma operation 定義から OpenAPI spec を生成し、
// 引数で指定された path に YAML として書き出す。
//
// 使い方:
//
//	go run ./cmd/openapi openapi.yaml
//
// 内部動作:
//  1. main.go と同じ huma config で新しい huma API を構築する
//     (humago adapter + http.NewServeMux、ただし server は起動しない)
//  2. handlers.RegisterAll(api, &noopRepo{}) で全 operation を登録
//     - main.go と single source of truth を共有することで、live server と
//       生成 spec の drift を構造的に防ぐ
//     - repo は spec 生成中に呼ばれないので noop で十分
//  3. api.OpenAPI().YAML() で spec を YAML 化 → 引数 path に書き出し
//
// この生成物は repo に commit する。CI が drift を検出できるように、
// またクライアント側 (apps/web) が openapi-typescript で型生成できるように。
package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"

	"github.com/danielgtaylor/huma/v2"
	"github.com/danielgtaylor/huma/v2/adapters/humago"

	"github.com/hashiguchip/chokunavi/apps/api/internal/handlers"
	"github.com/hashiguchip/chokunavi/apps/api/internal/repository"
)

// noopRepo は AppDataRepository を空実装で満たす dummy。
//
// cmd/openapi は spec 生成のために huma API を構築するだけで、
// 実際に operation handler を呼ばない (server も起動しない)。
// repo は handlers.RegisterAll() の引数として渡る必要があるが、
// 中身は使われないので zero value を返す stub で十分。
type noopRepo struct{}

func (noopRepo) GetAppDataForUser(_ context.Context, _ int) (*repository.AppData, error) {
	return &repository.AppData{}, nil
}

func main() {
	if len(os.Args) != 2 {
		slog.Error("usage: openapi <output-path>")
		os.Exit(2)
	}
	outPath := os.Args[1]

	// main.go の newServer と同じ huma config を使う。
	// OpenAPIPath/DocsPath/SchemasPath を空にしている点も合わせる
	// (この binary が出力する YAML 自体には影響しないが、live server の挙動を
	//  正確に反映するため)。
	humaConfig := huma.DefaultConfig("Resume 2026 API", "0.1.0")
	humaConfig.OpenAPIPath = ""
	humaConfig.DocsPath = ""
	humaConfig.SchemasPath = ""
	humaConfig.CreateHooks = nil

	api := humago.New(http.NewServeMux(), humaConfig)
	handlers.RegisterAll(api, noopRepo{})

	specYAML, err := api.OpenAPI().YAML()
	if err != nil {
		slog.Error("marshal openapi yaml", "err", err)
		os.Exit(1)
	}

	if err := os.WriteFile(outPath, specYAML, 0o644); err != nil {
		slog.Error("write openapi yaml", "path", outPath, "err", err)
		os.Exit(1)
	}
	slog.Info("openapi spec generated", "path", outPath, "bytes", len(specYAML))
}
