import { CONTENT } from "../_constants/content";

export function Problem() {
  return (
    <section className="px-5 py-8">
      <div className="mb-2.5 font-mono text-[10px] tracking-[2px] text-primary-500">{CONTENT.problem.kicker}</div>
      <h2 className="mb-4 text-[22px] font-[800] tracking-[-0.01em] text-slate-950">{CONTENT.problem.title}</h2>
      <p className="text-[13px] leading-[1.8] text-slate-700">{CONTENT.problem.body}</p>
    </section>
  );
}
