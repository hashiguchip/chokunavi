import { CONTENT } from "../_constants/content";

export function Voices() {
  return (
    <section className="px-5 py-8">
      <div className="mb-2.5 font-mono text-kicker tracking-kicker text-primary-500">VOICES / 04</div>
      <h3 className="mb-5 text-heading-section font-extrabold tracking-heading text-slate-950">導入企業の声</h3>
      <div className="flex flex-col gap-3">
        {CONTENT.voices.map((v) => (
          <div key={v.name} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-3 text-body-small leading-body text-slate-700">{v.body}</div>
            <div className="flex items-center gap-2.5">
              <div className="h-[30px] w-[30px] rounded-full bg-primary-500" />
              <div>
                <div className="text-xs font-bold text-slate-950">{v.name}</div>
                <div className="text-kicker text-slate-500">{v.role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
