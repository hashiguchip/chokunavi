import { H2 } from "@/components/ui/H2";
import { PHASE_MAP } from "@/constants/phases";
import { PROJECTS } from "@/constants/projects";
import { TECH_MAP } from "@/constants/tech";

export function Projects() {
  return (
    <section id="projects" className="bg-white px-5 py-10">
      <div className="mx-auto max-w-[1220px]">
        <H2>プロジェクト実績</H2>
        <div className="space-y-4">
          {PROJECTS.map((p) => (
            <div key={p.id} className="rounded border border-neutral-300 p-5">
              <h3 className="mb-3 font-bold text-base text-neutral-950">{p.title}</h3>
              <div className="mb-3 grid gap-1 text-[13px] sm:grid-cols-3">
                <div>
                  <span className="font-semibold text-neutral-700">期間:</span> {p.period}
                </div>
                <div>
                  <span className="font-semibold text-neutral-700">チーム規模:</span> {p.team}
                </div>
                <div>
                  <span className="font-semibold text-neutral-700">役割:</span> {p.role}
                </div>
              </div>
              <div className="mb-2 flex flex-wrap gap-1.5">
                {p.techIds.map((id) => {
                  const tech = TECH_MAP.get(id);
                  if (!tech) return null;
                  return (
                    <span
                      key={id}
                      className="rounded bg-primary-500/10 px-2 py-0.5 font-semibold text-[11px] text-primary-500"
                    >
                      {tech.label}
                    </span>
                  );
                })}
              </div>
              <div className="mb-3 flex flex-wrap gap-1.5">
                {p.phaseIds.map((id) => {
                  const phase = PHASE_MAP.get(id);
                  if (!phase) return null;
                  return (
                    <span key={id} className="rounded bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-700">
                      {phase.label}
                    </span>
                  );
                })}
              </div>
              <div className="rounded bg-neutral-100 p-3 text-[13px] text-neutral-800 leading-[1.6]">
                <span className="font-semibold text-neutral-950">概要: </span>
                {p.summary}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
