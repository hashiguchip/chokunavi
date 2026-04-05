import { H2 } from "@/components/ui/H2";
import { JobHeader } from "./JobHeader";

const BENEFITS = [
  {
    title: "10年分の設計判断力",
    description: "「とりあえず動く」ではなく「半年後に困らない」設計。過去の失敗も成功も全部判断材料にしています。",
  },
  {
    title: "納期は守る主義",
    description:
      "見積もり精度に自信あり。バッファの取り方も10年で身につけました。「間に合いませんでした」は言いません。",
  },
  {
    title: "フルスタックで穴を埋める",
    description: "フロントもバックもインフラも。「誰がやるの？」の「誰か」になれます。少人数チームほど効きます。",
  },
  {
    title: "新しい技術への好奇心",
    description: "10年やっても飽きてません。最新のエコシステムにも自分からキャッチアップしています。",
  },
];

export function JobInfo() {
  return (
    <section id="job" className="bg-white px-5 py-10">
      <div className="mx-auto max-w-[1220px]">
        <JobHeader />

        <H2>できること</H2>
        <p className="mb-10 text-[#333] text-[14px] leading-[1.8]">
          エンジニア歴10年。BtoB
          SaaS・EC・メディアなど複数ドメインで、設計から実装・運用まで一貫して担当してきました。リーダー・技術選定の経験を経て、現在はシニアICとして設計・実装に専念しています。
        </p>
        <p className="mb-10 text-[#333] text-[14px] leading-[1.8]">
          目の前の課題を解決するだけでなく、その先の変更や運用まで見据えて設計・実装するのがポリシーです。技術選定のご相談、設計レビュー、実装、何でも対応します。まずはカジュアルにお話ししましょう。
        </p>

        <H2>提供できるスキル・価値</H2>
        <div className="mb-10 grid gap-3 sm:grid-cols-2">
          {BENEFITS.map((b, i) => (
            <div key={b.title} className="flex gap-3 rounded border border-[#ddd] p-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-primary-500 font-bold text-[11px] text-white">
                {String(i + 1).padStart(2, "0")}
              </div>
              <div>
                <h3 className="mb-1 font-bold text-[#333] text-[14px]">{b.title}</h3>
                <p className="text-[#555] text-[12px] leading-[1.6]">{b.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
