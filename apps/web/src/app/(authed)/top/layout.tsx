import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "チョクナビ | エンジニア採用をもっとシンプルに",
  description:
    "エージェントを介さないダイレクトリクルーティング。現場で活躍するミドル〜ハイクラスのエンジニアへ直接スカウト。",
};

export default function TopLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
