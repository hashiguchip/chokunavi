"use client";

import { trackContactCtaClick } from "@/libs/analytics";
import { closeModal } from "@/libs/global-modal";
import { posthog } from "@/libs/posthog";

export function ThankYouModal() {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="w-[calc(100vw-32px)] max-w-[360px] rounded-lg bg-white px-8 py-10 text-center shadow-xl"
    >
      <p className="mb-2 text-[40px] leading-none">🎉</p>
      <h2 className="mb-3 font-bold text-lg text-neutral-950">ありがとうございます！</h2>
      <p className="mb-6 text-neutral-700 text-sm leading-relaxed">
        「気になる」していただき感謝します。
        <br />
        まずはカジュアルにご相談ください。
      </p>
      <div className="flex flex-col gap-3">
        {/* biome-ignore lint/a11y/useValidAnchor: ページ内アンカー遷移 + モーダルclose */}
        <a
          href="#contact"
          onClick={() => {
            trackContactCtaClick("interest-modal");
            posthog.capture("contact_cta_click", { location: "interest-modal" });
            closeModal();
          }}
          className="rounded bg-primary-500 px-6 py-3 font-bold text-sm text-white transition hover:bg-primary-700"
        >
          このエンジニアに話を聞いてみる
        </a>
        <button
          type="button"
          onClick={closeModal}
          className="text-[13px] text-neutral-500 transition hover:text-neutral-700"
        >
          閉じる
        </button>
      </div>
    </div>
  );
}
