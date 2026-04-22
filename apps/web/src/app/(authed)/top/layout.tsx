import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Noto_Sans_JP } from "next/font/google";

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-jp",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "チョクナビ | エンジニア採用をもっとシンプルに",
  description:
    "エージェントを介さないダイレクトリクルーティング。48,000名の登録エンジニアから、貴社に合った人材へ直接スカウト。",
};

export default function TopLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={`${notoSansJP.variable} ${inter.variable} ${jetbrainsMono.variable} ${notoSansJP.className}`}>
      {children}
    </div>
  );
}
