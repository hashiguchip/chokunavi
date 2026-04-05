"use client";

import { closeModal } from "@/libs/global-modal";

export function ThankYouModal() {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="w-[calc(100vw-32px)] max-w-[360px] rounded-lg bg-white px-8 py-10 text-center shadow-xl"
    >
      <p className="mb-2 text-[40px] leading-none">🎉</p>
      <h2 className="mb-3 font-bold text-[#333] text-[18px]">ありがとうございます！</h2>
      <p className="mb-6 text-[#666] text-[14px] leading-relaxed">
        「気になる」していただき感謝します。
        <br />
        ぜひお気軽にご応募ください！
      </p>
      <div className="flex flex-col gap-3">
        {/* biome-ignore lint/a11y/useValidAnchor: ページ内アンカー遷移 + モーダルclose */}
        <a
          href="#contact"
          onClick={closeModal}
          className="rounded bg-primary-500 px-6 py-3 font-bold text-[14px] text-white transition hover:bg-primary-700"
        >
          応募フォームへ進む
        </a>
        <button type="button" onClick={closeModal} className="text-[#999] text-[13px] transition hover:text-[#666]">
          閉じる
        </button>
      </div>
    </div>
  );
}
