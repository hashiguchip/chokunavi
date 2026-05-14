"use client";

import { ExternalLink } from "lucide-react";
import { DLRow } from "@/components/ui/DLRow";
import { trackContactCtaClick, trackXLinkClick } from "@/libs/analytics";
import { posthog } from "@/libs/posthog";
import { useAppDataStore } from "@/stores/app-data";
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

function ProfileThoughtBubble({ href, text }: { href: string; text: string }) {
  const handleClick = () => {
    trackXLinkClick("profile_thought_bubble", href);
    posthog.capture("x_link_click", { location: "profile_thought_bubble", link_url: href });
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="X の投稿を開く"
      onClick={handleClick}
      className="group relative inline-block w-fit max-w-[calc(100vw-64px)] rounded-2xl bg-sky-100 px-4 py-2.5 transition hover:bg-sky-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 sm:max-w-[640px]"
    >
      <p className="line-clamp-2 break-all text-[11px] leading-[1.55] text-sky-950 sm:line-clamp-1">{text}</p>
      <span
        className="-bottom-1.5 absolute left-9 h-3.5 w-3.5 rotate-45 bg-sky-100 transition group-hover:bg-sky-200"
        aria-hidden="true"
      />
    </a>
  );
}

function ProfileAvatar({ xProfileUrl }: { xProfileUrl?: string }) {
  if (!xProfileUrl) {
    return (
      <img src="profile-image.png" alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover" aria-hidden="true" />
    );
  }

  const handleClick = () => {
    trackXLinkClick("profile_avatar", xProfileUrl);
    posthog.capture("x_link_click", { location: "profile_avatar", link_url: xProfileUrl });
  };

  return (
    <div className="relative h-[104px] w-20">
      <a
        href={xProfileUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="X のプロフィールを開く"
        onClick={handleClick}
        className="group absolute bottom-0 left-0 flex flex-col items-center gap-1 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
      >
        <img src="profile-image.png" alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover" aria-hidden="true" />
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-neutral-700 transition group-hover:text-neutral-950">
          <span className="flex h-4 w-4 items-center justify-center rounded-sm bg-neutral-950 text-[10px] text-white">
            X
          </span>
          Xで見る
          <ExternalLink size={12} aria-hidden="true" />
        </span>
      </a>
    </div>
  );
}

export function JobHeader() {
  const settings = useAppDataStore((s) => s.data?.settings);
  const xProfileUrl = settings?.xProfileUrl;
  const xPostText = settings?.xPostText;
  const xPostUrl = settings?.xPostUrl;

  return (
    <div className="mb-8 rounded border border-neutral-300 bg-white">
      <div className="px-5 pt-5">
        {xPostText && xPostUrl && (
          <div className="mb-3">
            <ProfileThoughtBubble href={xPostUrl} text={xPostText} />
          </div>
        )}
        <div className="mb-5 grid grid-cols-[80px_minmax(0,1fr)] gap-x-5 gap-y-3">
          <div className="col-start-2 flex flex-wrap gap-1.5">
            {PROFILE_TAGS.map((tag) => (
              <span
                key={tag}
                className="inline-flex h-6 items-center rounded bg-neutral-100 px-2 text-[11px] leading-none text-neutral-800"
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="row-span-2 row-start-1 self-start">
            <ProfileAvatar xProfileUrl={xProfileUrl} />
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
          まずはお気軽にご相談ください
        </a>
        <InterestButton />
      </div>

      <InterestIndicator />
    </div>
  );
}
