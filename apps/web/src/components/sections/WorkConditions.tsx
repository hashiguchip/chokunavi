import clsx from "clsx";
import { H2 } from "@/components/ui/H2";

const CONDITIONS = [
  { label: "稼働開始", value: "2026年5月1日〜" },
  { label: "稼働時間", value: "週5日（140〜180h / 月）" },
  { label: "契約形態", value: "準委任契約（請負も相談可 / 法人契約対応可）" },
  { label: "コミュニケーション", value: "Slack / Discord / Google Meet 対応" },
  { label: "インボイス", value: "適格請求書発行事業者 登録済み" },
];

export function WorkConditions() {
  return (
    <section id="conditions" className="bg-white px-5 py-10">
      <div className="mx-auto max-w-[1220px]">
        <H2>稼働条件</H2>
        <div className="overflow-hidden rounded border border-[#ddd]">
          {CONDITIONS.map((item, i) => (
            <div
              key={item.label}
              className={clsx("flex border-[#eee] border-b last:border-b-0", i % 2 === 1 && "bg-[#fafafa]")}
            >
              <div className="w-[140px] shrink-0 bg-[#f5f5f5] px-4 py-3 font-semibold text-[#333] text-[13px] md:w-[180px]">
                {item.label}
              </div>
              <div className="flex-1 px-4 py-3 text-[#333] text-[14px]">{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
