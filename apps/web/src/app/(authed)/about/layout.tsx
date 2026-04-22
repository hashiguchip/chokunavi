import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-jp",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "About | チョクナビ",
  description: "チョクナビは、エンジニアの働き方を変える movement。エンジニアと企業が直接つながる選択肢を。",
};

export default function AboutLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className={`${notoSansJP.variable} ${notoSansJP.className}`}>{children}</div>;
}
