# @libs/http

Result ベースの HTTP クライアント。**throw しない**設計で、すべてのエラーを型安全に扱う。

## Why not throw?

主要ライブラリ（ky, axios, wretch）は非 2xx レスポンスで例外を throw する。
この設計には 2 つの問題がある。

### 1. エラーの型が消える

```typescript
// throw ベース — catch に来るエラーの型が unknown
try {
  const data = await ky.get(url).json();
} catch (e) {
  // e: unknown — ネットワーク障害？タイムアウト？HTTP 404？パースエラー？
}
```

```typescript
// Result ベース — エラーの種類が型で判別できる
const result = await http.get(url, { schema });
if (!result.ok) {
  result.error.type; // "network" | "timeout" | "http" | "parse" | "abort"
}
```

### 2. try/catch にはバグの種がある

```typescript
// 危険: onComplete() が throw すると catch に落ちる
// → 送信は成功したのに「送信失敗」と表示される
try {
  await submitForm(data);
  onComplete(); // ← これが throw したら？
} catch {
  setError("送信に失敗しました");
}
```

```typescript
// Result なら onComplete() はエラーチェックの外
const result = await submitForm(data);
if (!result.ok) {
  setError("送信に失敗しました");
  return;
}
onComplete(); // ← 送信成功後にのみ実行。throw しても catch されない
```

## Why not ky / axios?

| | ky | axios | @libs/http |
|---|---|---|---|
| エラーハンドリング | throw | throw | Result 型 |
| レスポンス検証 | なし | なし | Zod schema |
| エラーの型安全性 | `catch (e: unknown)` | `catch (e: unknown)` | `error.type` で判別 |
| バンドルサイズ | 3.3 KB gzip | 13 KB gzip | ~1 KB |
| リトライ | あり | プラグイン | あり（GET のみ） |

## Features

- **Result\<T\> 型** — 成功/失敗を判別共用体で表現。try/catch 不要
- **Zod schema 検証** — `schema` を渡すとレスポンスをランタイム検証し、型を自動推論
- **リトライ** — GET のみ、network/timeout エラーのみ、exponential backoff
- **abort / timeout 判別** — ユーザーキャンセルとタイムアウトを区別
- **204 No Content 対応** — 空レスポンスを安全に処理
- **安全な JSON パース** — `res.text()` + `JSON.parse()` で throw を完全封じ込め

## Architecture

```
src/libs/http/     ← 汎用 HTTP クライアント（プロジェクト非依存）
src/services/      ← API Layer（URL + schema + options をバインド）
src/stores/        ← Zustand ストア（api を呼び出す）
src/components/    ← UI コンポーネント（api を呼び出す）
```

HTTP クライアントは汎用。アプリ固有の知識（URL, schema, ヘッダー）は API Layer がバインドする。

## Usage

```typescript
import { api } from "@/services/api";

// API Layer 経由 — URL, schema, options はバインド済み
const result = await api.pricing(code);
if (result.ok) {
  console.log(result.data.rate); // 型安全: PricingData
}
```

```typescript
// 直接使用 — schema で型推論 + ランタイム検証
import { createHttpClient } from "@/libs/http";
import { z } from "zod";

const http = createHttpClient({ timeout: 5000 });
const schema = z.object({ id: z.number(), name: z.string() });

const result = await http.get("https://api.example.com/user/1", { schema });
//    ^? Result<{ id: number; name: string }>  — schema から自動推論
```

## Error Types

| type | 発生条件 | 追加フィールド |
|---|---|---|
| `network` | DNS 解決失敗、接続拒否、レスポンスボディ読み取り失敗 | — |
| `timeout` | `AbortSignal.timeout()` による中断 | — |
| `http` | 非 2xx ステータスコード | `status: number` |
| `parse` | JSON パース失敗、Zod スキーマ検証失敗 | — |
| `abort` | ユーザーの `AbortController` による明示的キャンセル | — |

## Result Utilities

`Result` は型としても値としても使える（declaration merging）:

```typescript
import { Result } from "@/libs/http";

// ファクトリ
Result.ok(data)    // → { ok: true, data }
Result.err(error)  // → { ok: false, error }

// 変換
Result.map(result, (data) => data.name)        // 成功値を変換
Result.mapError(result, (err) => ({ ...err, message: `[API] ${err.message}` })) // エラーを変換

// 取り出し
Result.unwrapOr(result, fallback)  // 成功なら data、失敗なら fallback
Result.match(result, {
  ok:  (data) => `Got ${data}`,
  err: (error) => `Failed: ${error.message}`,
})
```
