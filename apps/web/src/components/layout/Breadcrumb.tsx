"use client";

import { showDummyPopover } from "@/utils/showDummyPopover";

export function Breadcrumb() {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    showDummyPopover(e.currentTarget);
  };

  return (
    <nav aria-label="パンくずリスト" className="bg-[#f5f5f5] px-5 py-2">
      <div className="mx-auto max-w-[1220px] text-[#999] text-[11px]">
        <button type="button" className="cursor-pointer text-primary-500 hover:underline" onClick={handleClick}>
          HOME
        </button>
        {" > "}
        <button type="button" className="cursor-pointer text-primary-500 hover:underline" onClick={handleClick}>
          エンジニア検索
        </button>
        {" > "}
        <span className="text-[#333]">フルスタックエンジニア</span>
      </div>
    </nav>
  );
}
