"use client";

import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { showDummyPopover } from "@/utils/showDummyPopover";

const REAL_LINKS: Record<string, string> = {
  チョクナビについて: "/about",
};

const FOOTER_COLUMNS = [
  { heading: "求人を探す", items: ["職種から探す", "勤務地から探す", "年収から探す"] },
  { heading: "おすすめ", items: ["スカウト", "転職フェア", "適性診断"] },
  { heading: "転職ノウハウ", items: ["履歴書の書き方", "面接対策", "退職手続き"] },
  { heading: "その他", items: ["運営会社", "利用規約", "プライバシーポリシー", "チョクナビについて"] },
] as const;

export function Footer() {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    showDummyPopover(e.currentTarget);
  };

  return (
    <footer className="bg-neutral-950 px-5 py-10">
      <div className="mx-auto max-w-[1220px]">
        <div className="mb-6">
          <Logo />
        </div>
        <div className="mb-6 grid gap-6 text-neutral-300 text-xs md:grid-cols-4">
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.heading}>
              <h4 className="mb-2 font-bold text-white">{col.heading}</h4>
              {col.items.map((item) =>
                REAL_LINKS[item] ? (
                  <Link
                    key={item}
                    href={REAL_LINKS[item]}
                    className="block transition-colors duration-150 hover:text-white"
                  >
                    {item}
                  </Link>
                ) : (
                  <button
                    key={item}
                    type="button"
                    className="block cursor-pointer text-left transition-colors duration-150 hover:text-white"
                    onClick={handleClick}
                  >
                    {item}
                  </button>
                ),
              )}
            </div>
          ))}
        </div>
        <div className="border-neutral-800 border-t pt-4 text-center text-neutral-500 text-xs">
          &copy; 2026 H・R All Rights Reserved.
        </div>
      </div>
    </footer>
  );
}
