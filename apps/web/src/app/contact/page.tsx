import type { Metadata } from "next";
import { ContactPage } from "@/components/contact/ContactPage";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

export const metadata: Metadata = {
  title: "お問い合わせ | チョクナビ",
};

export default function Page() {
  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-950">
      <Header />
      <ContactPage />
      <Footer />
    </div>
  );
}
