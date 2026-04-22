import clsx from "clsx";
import Link from "next/link";
import { CONTENT } from "../_constants/content";

export function About() {
  return (
    <section className="px-5 pt-12 pb-8">
      <div className="mb-2.5 font-mono text-kicker tracking-kicker text-primary-500">ABOUT / 01</div>
      <h2 className="whitespace-pre-line text-heading-large font-extrabold leading-heading tracking-heading text-slate-950">
        {CONTENT.what.title}
      </h2>
      <p className="mt-4 text-body-small leading-body text-slate-700">
        {CONTENT.what.body}
        <Link
          href="/about"
          className="inline-flex items-center gap-1 font-semibold text-primary-500 transition hover:opacity-75"
        >
          チョクナビとは &rarr;
        </Link>
      </p>

      <div className="mt-6 grid grid-cols-2 gap-2.5">
        {CONTENT.stats.map((s, i) => (
          <div
            key={s.v}
            className={clsx(
              "rounded-card-sm p-4",
              i === 0 ? "bg-primary-500 text-white" : "border border-slate-200 bg-white text-slate-950",
            )}
          >
            <div className="text-[26px] font-black leading-none tracking-display">{s.k}</div>
            <div className={clsx("mt-2 text-label", i === 0 ? "opacity-85" : "opacity-60")}>{s.v}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
