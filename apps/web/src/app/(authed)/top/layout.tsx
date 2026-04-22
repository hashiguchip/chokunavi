import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-jp",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
});

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
  return <div className={`${notoSansJP.variable} ${notoSansJP.className}`}>{children}</div>;
}
