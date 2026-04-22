import { CONTENT } from "../_constants/content";

export function Movement() {
  return (
    <section className="px-5 py-8 pb-12">
      <div className="mb-2.5 font-mono text-[10px] tracking-[2px] text-primary-500">{CONTENT.movement.kicker}</div>
      <h2 className="mb-4 text-[22px] font-extrabold tracking-heading text-slate-950">{CONTENT.movement.title}</h2>
      <p className="text-body-small leading-[1.8] text-slate-700">{CONTENT.movement.body}</p>
    </section>
  );
}
