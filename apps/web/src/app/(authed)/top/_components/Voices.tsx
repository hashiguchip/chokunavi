import { CONTENT } from "../_constants/content";

export function Voices() {
  return (
    <section className="px-5 py-8">
      <div className="mb-2.5 font-mono text-[10px] tracking-[2px] text-primary-500">VOICES / 04</div>
      <h3 className="mb-5 text-[22px] font-[800] tracking-[-0.01em] text-[#0F1115]">導入企業の声</h3>
      <div className="flex flex-col gap-3">
        {CONTENT.voices.map((v) => (
          <div key={v.name} className="rounded-2xl border border-[#EEF0F3] bg-white p-5">
            <div className="mb-3 text-sm leading-[1.8] text-[#2E3440]">{v.body}</div>
            <div className="flex items-center gap-2.5">
              <div className="h-[30px] w-[30px] rounded-full bg-primary-500" />
              <div>
                <div className="text-xs font-bold text-[#0F1115]">{v.name}</div>
                <div className="text-[10px] text-[#6B7280]">{v.role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
