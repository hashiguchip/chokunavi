import { CONTENT } from "../_constants/content";

export function WhatWeDo() {
  return (
    <section className="px-5 py-8">
      <div className="mb-2.5 font-mono text-kicker tracking-kicker text-primary-500">{CONTENT.what.kicker}</div>
      <h2 className="mb-4 whitespace-pre-line text-heading-section font-extrabold tracking-heading text-slate-950">
        {CONTENT.what.title}
      </h2>
      <div className="flex flex-col gap-3">
        {CONTENT.what.items.map((item) => (
          <div key={item.num} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-badge bg-primary-50 font-mono text-body-small font-bold text-primary-500">
              {item.num}
            </div>
            <div className="mb-1.5 text-base font-extrabold tracking-heading text-slate-950">{item.title}</div>
            <div className="text-body-small leading-body-compact text-slate-500">{item.desc}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
