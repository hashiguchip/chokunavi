import { CONTENT } from "../_constants/content";

export function Features() {
  return (
    <section className="px-5 py-8">
      <div className="mb-2.5 font-mono text-[10px] tracking-[2px] text-primary-500">FEATURES / 03</div>
      <h3 className="mb-5 text-[22px] font-[800] tracking-[-0.01em] text-[#0F1115]">選ばれる、3つの理由。</h3>
      <div className="flex flex-col gap-3">
        {CONTENT.reasons.map((r) => (
          <div key={r.num} className="rounded-2xl border border-[#EEF0F3] bg-white p-5">
            <div className="mb-3.5 flex h-9 w-9 items-center justify-center rounded-[10px] bg-primary-50 font-mono text-[13px] font-bold text-primary-500">
              {r.num}
            </div>
            <div className="mb-2 text-base font-[800] tracking-[-0.01em] text-[#0F1115]">{r.title}</div>
            <div className="text-[13px] leading-[1.7] text-[#6B7280]">{r.body}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
