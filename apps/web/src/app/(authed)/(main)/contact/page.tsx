import type { Metadata } from "next";
import { ContactPage } from "@/components/contact/ContactPage";

export const metadata: Metadata = {
  title: "お問い合わせ | チョクナビ",
};

export default function Page() {
  return (
    <div className="bg-neutral-100">
      <ContactPage />
    </div>
  );
}
