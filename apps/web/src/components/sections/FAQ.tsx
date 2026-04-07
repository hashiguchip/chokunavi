import { H2 } from "@/components/ui/H2";

const FAQS = [
  {
    q: "週3〜4日の稼働は可能ですか？",
    a: "ご相談可能です。プロジェクトの状況に合わせて柔軟に対応します。",
  },
  {
    q: "他社と掛け持ちしていますか？",
    a: "基本的には掛け持ちしておりません。御社の案件に集中して取り組みます。",
  },
  {
    q: "チーム開発は得意ですか？",
    a: "はい。コードレビュー、ペアプロ、モブプロすべて対応可能です。一人で抱え込まず、チームとしてのアウトプットを最大化することを大事にしています。",
  },
  {
    q: "得意な領域はフロントとバックどちらですか？",
    a: "フロントエンド（React / Next.js）が主戦場ですが、バックエンド（PHP / MySQL）も一通り対応できます。「両方やるから1人で済む」が強みです。",
  },
  {
    q: "途中から参画しても大丈夫ですか？",
    a: "既存コードベースのキャッチアップは得意です。参画初日にPRを出すことを目標にしています。",
  },
  {
    q: "テキストでのコミュニケーションは問題ないですか？",
    a: "Slackでの報告・相談は丁寧に行います。テキストベースで認識齟齬が起きないよう、要点をまとめて伝えることを意識しています。",
  },
  {
    q: "AIツールは活用していますか？",
    a: "Claude CodeとCursorを日常的に使っています。設計判断は自分の頭で、実装の加速にAIを。道具として使いこなすことで、一人でもスピードと品質を両立しています。",
  },
  {
    q: "開発の進め方にこだわりはありますか？",
    a: "特にこだわりはありません。アジャイル・ウォーターフォールどちらも経験がありますので、御社の進め方に合わせて柔軟に対応します。どんな現場でもまずチームのやり方を尊重し、早く馴染むことを大切にしています。",
  },
  {
    q: "法人契約は可能ですか？",
    a: "はい、対応可能です。個人事業主との直接契約が難しい場合でも、提携先の法人を通じてご契約いただけますのでご安心ください。法人契約をご希望の際はお気軽にお知らせください。",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="bg-neutral-100 px-5 py-10">
      <div className="mx-auto max-w-[1220px]">
        <H2>よくある質問</H2>
        <div className="space-y-3">
          {FAQS.map((faq) => (
            <div key={faq.q} className="rounded border border-neutral-300 bg-white">
              <div className="flex items-start gap-3 px-5 py-4">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-500 font-bold text-white text-xs">
                  Q
                </span>
                <p className="font-semibold text-neutral-950 text-sm">{faq.q}</p>
              </div>
              <div className="flex items-start gap-3 border-neutral-200 border-t px-5 py-4">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-trial font-bold text-white text-xs">
                  A
                </span>
                <p className="text-neutral-800 text-sm leading-[1.8]">{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
