import { Noto_Sans_JP } from "next/font/google";
import { AuthGate } from "@/components/layout/AuthGate";

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-jp",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
});

export default function AuthedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthGate>
      <div className={`${notoSansJP.variable} ${notoSansJP.className}`}>{children}</div>
    </AuthGate>
  );
}
