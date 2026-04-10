"use client";

import { H2 } from "@/components/ui/H2";
import { PHASE_MAP } from "@/constants/phases";
import { TECH_MAP } from "@/constants/tech";
import { useAppDataStore } from "@/stores/app-data";

// 期間を「YYYY年M月〜YYYY年M月（X年Yヶ月）」形式に整形する。
// periodEnd が無い場合は「現在」、終了日と開始日の差から年月を計算する。
function formatPeriod(start: string, end?: string): string {
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : new Date();
  const startLabel = `${startDate.getFullYear()}年${startDate.getMonth() + 1}月`;
  const endLabel = end ? `${endDate.getFullYear()}年${endDate.getMonth() + 1}月` : "現在";
  const months =
    (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth()) + 1;
  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  const duration =
    years > 0 && remMonths > 0 ? `${years}年${remMonths}ヶ月` : years > 0 ? `${years}年` : `${remMonths}ヶ月`;
  return `${startLabel}〜${endLabel}（${duration}）`;
}

export function Projects() {
  const projects = useAppDataStore((s) => s.data?.projects);
  if (!projects) return null;

  return (
    <section id="projects" className="bg-white px-5 py-10">
      <div className="mx-auto max-w-[1220px]">
        <H2>プロジェクト実績</H2>
        <div className="space-y-4">
          {projects.map((p) => (
            <div key={p.id} className="rounded border border-neutral-300 p-5">
              <h3 className="mb-3 font-bold text-base text-neutral-950">{p.title}</h3>
              <div className="mb-3 grid gap-1 text-[13px] sm:grid-cols-3">
                <div>
                  <span className="font-semibold text-neutral-700">期間:</span>{" "}
                  {formatPeriod(p.periodStart, p.periodEnd)}
                </div>
                <div>
                  <span className="font-semibold text-neutral-700">チーム規模:</span> {p.team}
                </div>
                <div>
                  <span className="font-semibold text-neutral-700">役割:</span> {p.role}
                </div>
              </div>
              <div className="mb-2 flex flex-wrap gap-1.5">
                {(p.techIds ?? []).map((id) => {
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
                {(p.phaseIds ?? []).map((id) => {
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
