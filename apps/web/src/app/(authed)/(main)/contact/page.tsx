import type { Metadata } from "next";
import { ContactPage } from "@/components/contact/ContactPage";

export const metadata: Metadata = {
  title: "連絡フォーム | チョクナビ",
};

export default function Page() {
  return (
    <div className="bg-neutral-100">
      <ContactPage />
    </div>
  );
}
