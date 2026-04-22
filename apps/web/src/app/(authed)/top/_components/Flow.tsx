const STEPS = [
  {
    n: "01",
    t: "お問い合わせ",
    d: "プロフィールを見て興味を持ったら、フォームからご連絡ください。",
  },
  {
    n: "02",
    t: "面談・条件交渉",
    d: "オンライン・オフライン問わず、スキルマッチや条件を当事者間で自由にすり合わせ。",
  },
  {
    n: "03",
    t: "契約締結",
    d: "契約形態・条件はエンジニアと企業間で直接取り決め。NDA等も個別に対応可能です。",
  },
  {
    n: "04",
    t: "稼働開始",
    d: "最短で翌月から参画可能。稼働開始後も定期的にすり合わせを行います。",
  },
] as const;

export function Flow() {
  return (
    <section className="px-5 py-8">
      <div className="mb-2.5 font-mono text-[10px] tracking-[2px] text-primary-500">FLOW / 06</div>
      <h3 className="mb-5 text-[22px] font-[800] tracking-[-0.01em] text-[#0F1115]">導入の流れ</h3>
      <div className="relative pl-8">
        {STEPS.map((step, i) => {
          const isLast = i === STEPS.length - 1;
          return (
            <div key={step.n} className="relative pb-8 last:pb-0">
              {!isLast && <div className="absolute left-[-20px] top-[14px] h-full w-px bg-[#D1D5DB]" />}
              <div className="absolute left-[-24px] top-[2px] flex h-[10px] w-[10px] items-center justify-center rounded-full border-2 border-primary-500 bg-white" />
              <div className="rounded-[14px] border border-[#EEF0F3] bg-white p-4">
                <div className="mb-1 font-mono text-[11px] font-bold text-primary-500">STEP {step.n}</div>
                <div className="mb-1.5 text-sm font-bold text-[#0F1115]">{step.t}</div>
                <div className="text-[13px] leading-[1.7] text-[#6B7280]">{step.d}</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
