import { CONTENT } from "../_constants/content";
import { CheckIcon } from "./icons";

export function Pricing() {
  return (
    <section className="px-5 py-8">
      <div className="mb-2.5 font-mono text-[10px] tracking-[2px] text-primary-500">PRICING / 05</div>
      <h3 className="mb-5 text-[22px] font-[800] tracking-[-0.01em] text-[#0F1115]">料金プラン</h3>
      <div className="flex flex-col gap-3 lg:flex-row">
        {CONTENT.pricing.map((p) => (
          <div key={p.name} className="rounded-2xl border border-[#EEF0F3] bg-white p-5 text-[#0F1115] lg:flex-1">
            <div className="mb-1.5 text-sm font-bold">{p.name}</div>
            <div className="mb-2.5 flex items-baseline gap-1">
              <span className="text-[28px] font-[900] tracking-[-0.02em]">{p.price}</span>
              <span className="text-xs opacity-60">{p.unit}</span>
            </div>
            <div className="mb-3.5 text-xs leading-[1.6] opacity-75">{p.desc}</div>
            <div className="flex flex-col gap-2">
              {p.features.map((f) => (
                <div key={f} className="flex items-center gap-2 text-[13px]">
                  <CheckIcon color="#0066cc" size={14} />
                  {f}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
