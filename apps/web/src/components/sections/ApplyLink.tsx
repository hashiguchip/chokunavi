"use client";

import { phApplyClick } from "@/libs/posthog";

export function ApplyLink() {
  return (
    // biome-ignore lint/a11y/useValidAnchor: ページ内アンカー + analytics トラッキング
    <a
      href="#contact"
      onClick={() => phApplyClick("header")}
      className="w-full rounded bg-primary-500 px-8 py-3 text-center font-bold text-[15px] text-white transition hover:bg-primary-700 sm:w-auto"
    >
      応募フォームへ進む
    </a>
  );
}
