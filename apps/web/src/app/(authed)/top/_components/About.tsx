import { CONTENT } from "../_constants/content";

export function About() {
  return (
    <section className="px-5 pt-12 pb-8">
      <div className="mb-2.5 font-mono text-[10px] tracking-[2px] text-primary-500">ABOUT / 01</div>
      <h2 className="whitespace-pre-line text-[28px] font-[800] leading-[1.3] tracking-[-0.01em] text-[#0F1115]">
        {CONTENT.what.title}
      </h2>
      <p className="mt-4 text-sm leading-[1.8] text-[#2E3440]">{CONTENT.what.body}</p>

      <div className="mt-6 grid grid-cols-2 gap-2.5">
        {CONTENT.stats.map((s, i) => (
          <div
            key={s.v}
            className={
              i === 0
                ? "rounded-[14px] bg-primary-500 p-4 text-white"
                : "rounded-[14px] border border-[#EEF0F3] bg-white p-4 text-[#0F1115]"
            }
          >
            <div className="text-[26px] font-[900] leading-none tracking-[-0.02em]">{s.k}</div>
            <div className="mt-2 text-[11px]" style={{ opacity: i === 0 ? 0.85 : 0.6 }}>
              {s.v}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
