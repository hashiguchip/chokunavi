import { CONTENT } from "../_constants/content";

export function Flow() {
  return (
    <section className="px-5 py-8">
      <div className="mb-2.5 font-mono text-kicker tracking-kicker text-primary-500">FLOW / 06</div>
      <h3 className="mb-5 text-heading-section font-extrabold tracking-heading text-slate-950">導入の流れ</h3>
      <div className="relative pl-8">
        {CONTENT.steps.map((step, i) => {
          const isLast = i === CONTENT.steps.length - 1;
          return (
            <div key={step.n} className="relative pb-8 last:pb-0">
              {!isLast && <div className="absolute left-[-20px] top-[14px] h-full w-px bg-slate-300" />}
              <div className="absolute left-[-24px] top-[2px] flex h-[10px] w-[10px] items-center justify-center rounded-full border-2 border-primary-500 bg-white" />
              <div className="rounded-card-sm border border-slate-200 bg-white p-4">
                <div className="mb-1 font-mono text-label font-bold text-primary-500">STEP {step.n}</div>
                <div className="mb-1.5 text-sm font-bold text-slate-950">{step.t}</div>
                <div className="text-body-small leading-body-compact text-slate-500">{step.d}</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
