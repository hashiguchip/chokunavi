import { GoogleAnalytics } from "@next/third-parties/google";
import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Sans_JP, M_PLUS_Rounded_1c } from "next/font/google";
import { GA_MEASUREMENT_ID } from "@/libs/analytics";
import { GlobalModalHost } from "@/libs/global-modal";
import { GlobalPopoverHost } from "@/libs/global-popover";
import "./globals.css";

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const ibmPlexSansJP = IBM_Plex_Sans_JP({
  variable: "--font-ibm-plex-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const mPlusRounded1c = M_PLUS_Rounded_1c({
  variable: "--font-m-plus-rounded-1c",
  subsets: ["latin"],
  weight: "800",
});

export const metadata: Metadata = {
  title: "チョクナビ | エンジニア採用のご案内",
  description: "チョクナビ — エージェントを通さず直接繋がる、フルスタックエンジニアの採用情報ページです。",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      "max-video-preview": 0,
      "max-image-preview": "none",
      "max-snippet": 0,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${ibmPlexSans.variable} ${ibmPlexSansJP.variable} ${mPlusRounded1c.variable} antialiased`}>
        {children}
        <GlobalModalHost />
        <GlobalPopoverHost />
      </body>
      {GA_MEASUREMENT_ID && <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />}
    </html>
  );
}
