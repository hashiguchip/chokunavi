"use client";

import { showDummyPopover } from "@/utils/showDummyPopover";

export function Breadcrumb() {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    showDummyPopover(e.currentTarget);
  };

  return (
    <nav aria-label="パンくずリスト" className="bg-neutral-100 px-5 py-2">
      <div className="mx-auto max-w-[1220px] text-[11px] text-neutral-500">
        <button type="button" className="cursor-pointer text-primary-500 hover:underline" onClick={handleClick}>
          HOME
        </button>
        {" > "}
        <button type="button" className="cursor-pointer text-primary-500 hover:underline" onClick={handleClick}>
          エンジニア検索
        </button>
        {" > "}
        <span className="text-neutral-950">フルスタックエンジニア</span>
      </div>
    </nav>
  );
}
