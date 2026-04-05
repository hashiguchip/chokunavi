import { DLRow } from "@/components/ui/DLRow";
import { InterestButton } from "./InterestButton";
import { InterestIndicator } from "./InterestIndicator";
import { PricingRow } from "./PricingRow";

export function JobHeader() {
  return (
    <div className="mb-8 rounded border border-[#ddd] bg-white">
      <div className="px-5 pt-5">
        <div className="mb-3 flex flex-wrap gap-1.5">
          {[
            "シニアIC",
            "経験10年",
            "フロント/バックエンド",
            "自走力あり",
            "設計",
            "技術選定",
            "安定稼働",
            "長期稼働歓迎",
            "インボイス対応",
          ].map((tag) => (
            <span key={tag} className="rounded bg-[#f5f5f5] px-2 py-0.5 text-[#555] text-[11px]">
              {tag}
            </span>
          ))}
        </div>
        <h1 className="mb-1 font-bold text-[#333] text-[22px] leading-tight">フルスタックエンジニア</h1>
        <p className="mb-5 text-[#666] text-[13px]">H・R</p>
      </div>

      <DLRow label="契約形態" first>
        業務委託（準委任）
      </DLRow>
      <DLRow label="稼働場所">フルリモート</DLRow>
      <PricingRow />

      <div className="flex flex-col items-stretch gap-3 px-5 py-5 sm:flex-row sm:items-center">
        <a
          href="#contact"
          className="w-full rounded bg-primary-500 px-8 py-3 text-center font-bold text-[15px] text-white transition hover:bg-primary-700 sm:w-auto"
        >
          応募フォームへ進む
        </a>
        <InterestButton />
      </div>

      <InterestIndicator />
    </div>
  );
}
