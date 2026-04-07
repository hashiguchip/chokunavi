import { CircleAlert } from "lucide-react";
import { H2 } from "@/components/ui/H2";

const PAIN_POINTS = [
  {
    title: "リードクラスが抜けて、設計判断できる人がいない",
    description: "技術選定やアーキテクチャの相談相手がいないまま、開発が進んでいませんか？",
  },
  {
    title: "技術的負債がたまっているが、手が回らない",
    description: "新機能の開発に追われて、リファクタリングや改善がずっと後回しになっていませんか？",
  },
  {
    title: "フロントもバックもできる人が足りない",
    description: "別々に人を探すコストと、間に落ちるタスク。1人で両方できれば解決しませんか？",
  },
  {
    title: "人を増やしても、戦力になるまでに時間がかかる",
    description: "オンボーディングに1〜2ヶ月。結局、既存メンバーの負担が増えていませんか？",
  },
  {
    title: "とにかく今すぐ1人ほしい",
    description: "急な欠員や案件の拡大で、来月から稼働できるエンジニアを探していませんか？",
  },
  {
    title: "SESで来る人のスキルが事前にわからない",
    description: "スキルシートだけでは判断できず、面談したら思ってたのと違った…という経験はありませんか？",
  },
];

export function PainPoints() {
  return (
    <section id="pain-points" className="bg-neutral-100 px-5 py-10">
      <div className="mx-auto max-w-[1220px]">
        <H2>こんなことでお困りではありませんか？</H2>
        <div className="grid gap-3 sm:grid-cols-2">
          {PAIN_POINTS.map((item) => (
            <div key={item.title} className="flex gap-3 rounded border border-neutral-300 bg-white p-4">
              <CircleAlert size={20} className="mt-0.5 shrink-0 text-accent-trial" />
              <div>
                <h3 className="mb-1 font-bold text-neutral-950 text-sm">{item.title}</h3>
                <p className="text-neutral-800 text-xs leading-[1.6]">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
