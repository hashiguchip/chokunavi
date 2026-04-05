import { H2 } from "@/components/ui/H2";

const NICE_TO_HAVE = [
  "フロントエンド開発",
  "技術選定・アーキテクチャ設計に裁量がある",
  "技術書・学習費用の補助制度",
  "カンファレンスや勉強会への参加支援",
  "新しい技術へのチャレンジを歓迎する風土",
];

export function Requirements() {
  return (
    <section id="requirements" className="bg-[#f5f5f5] px-5 py-10">
      <div className="mx-auto max-w-[1220px]">
        <H2>必須条件</H2>
        <ul className="mb-8 space-y-1.5 pl-5 text-[#333] text-[14px]">
          <li className="list-disc">使用PCがmacであること</li>
          <li className="list-disc">
            リモートワーク制度があること（フルリモート）
            <span className="ml-1 text-[#666] text-[12px]">※たまの出社なら可</span>
          </li>
          <li className="list-disc">AI（Claude 等）を活用した開発が認められていること</li>
        </ul>

        <H2>歓迎条件</H2>
        <ul className="space-y-1.5 pl-5 text-[#555] text-[14px]">
          {NICE_TO_HAVE.map((n) => (
            <li key={n} className="list-disc">
              {n}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
