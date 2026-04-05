// ハッシュ → ソースラベル のマッピング
// 追加方法: echo -n "コード文字列" | shasum -a 256 でハッシュ生成
export const AUTH_CODES: Record<string, string> = {
  "1cafa6d851c65817d04c841673d025dcf4ed498435407058d3a36608d17e32b6": "proto",
};
