"use client";

import clsx from "clsx";
import { H2 } from "@/components/ui/H2";
import type { Settings } from "@/services/api/app-data";
import { useAppDataStore } from "@/stores/app-data";

const toConditions = (s: Settings) => [
  { label: "稼働開始", value: s.availableFrom },
  { label: "稼働時間", value: s.workHours },
  { label: "契約形態", value: s.contractType },
  { label: "コミュニケーション", value: s.communication },
  { label: "インボイス", value: s.invoiceStatus },
];

export function WorkConditions() {
  const settings = useAppDataStore((s) => s.data?.settings);
  if (!settings) return null;

  return (
    <section id="conditions" className="bg-white px-5 py-10">
      <div className="mx-auto max-w-[1220px]">
        <H2>稼働条件</H2>
        <div className="overflow-hidden rounded border border-neutral-300">
          {toConditions(settings).map((item, i) => (
            <div
              key={item.label}
              className={clsx("flex border-neutral-200 border-b last:border-b-0", i % 2 === 1 && "bg-neutral-50")}
            >
              <div className="w-[140px] shrink-0 bg-neutral-100 px-4 py-3 font-semibold text-[13px] text-neutral-950 md:w-[180px]">
                {item.label}
              </div>
              <div className="flex-1 px-4 py-3 text-neutral-950 text-sm">{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
