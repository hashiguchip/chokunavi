import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About | チョクナビ",
  description: "チョクナビは、エンジニアの働き方を変える movement。エンジニアと企業が直接つながる選択肢を。",
};

export default function AboutLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
