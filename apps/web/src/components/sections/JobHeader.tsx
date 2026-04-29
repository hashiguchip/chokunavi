"use client";

import { DLRow } from "@/components/ui/DLRow";
import { trackContactCtaClick } from "@/libs/analytics";
import { posthog } from "@/libs/posthog";
import { InterestButton } from "./InterestButton";
import { InterestIndicator } from "./InterestIndicator";
import { PricingRow } from "./PricingRow";

const PROFILE_TAGS = [
  "シニアIC",
  "経験10年",
  "フロント/バックエンド",
  "自走力あり",
  "設計",
  "技術選定",
  "安定稼働",
  "長期稼働歓迎",
  "週4〜5稼働",
  "インボイス対応",
];

function ProfileAvatar() {
  return (
    <img src="profile-image.png" alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover" aria-hidden="true" />
  );
}

export function JobHeader() {
  return (
    <div className="mb-8 rounded border border-neutral-300 bg-white">
      <div className="px-5 pt-5">
        <div className="mb-5 grid grid-cols-[80px_minmax(0,1fr)] gap-x-5 gap-y-2">
          <div className="col-start-2 flex flex-wrap gap-1.5">
            {PROFILE_TAGS.map((tag) => (
              <span key={tag} className="rounded bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-800">
                {tag}
              </span>
            ))}
          </div>
          <div className="row-span-2 row-start-1 self-center">
            <ProfileAvatar />
          </div>
          <div className="row-start-2 min-w-0 self-center">
            <h1 className="font-bold text-[22px] text-neutral-950 leading-tight">フルスタックエンジニア</h1>
            <p className="mt-1 text-[13px] text-neutral-700">H・R</p>
          </div>
        </div>
      </div>

      <DLRow label="契約形態" first>
        業務委託（準委任）
      </DLRow>
      <DLRow label="稼働場所">フルリモート</DLRow>
      <PricingRow />

      <div className="flex flex-col items-stretch gap-3 px-5 py-5 sm:flex-row sm:items-center">
        {/* biome-ignore lint/a11y/useValidAnchor: ページ内アンカー + analytics トラッキング */}
        <a
          href="#contact"
          onClick={() => {
            trackContactCtaClick("header");
            posthog.capture("apply_click", { location: "header" });
            posthog.capture("contact_cta_click", { location: "header" });
          }}
          className="w-full rounded bg-primary-500 px-8 py-3 text-center font-bold text-[15px] text-white transition hover:bg-primary-700 sm:w-auto"
        >
          このエンジニアに話を聞いてみる
        </a>
        <InterestButton />
      </div>

      <InterestIndicator />
    </div>
  );
}
