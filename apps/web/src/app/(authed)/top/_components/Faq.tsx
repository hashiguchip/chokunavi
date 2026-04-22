"use client";

import { useState } from "react";
import { CONTENT } from "../_constants/content";
import { MinusIcon, PlusIcon } from "./icons";

export function Faq() {
  const [openIndex, setOpenIndex] = useState(-1);

  return (
    <section className="px-5 py-8">
      <div className="mb-2.5 font-mono text-[10px] tracking-[2px] text-primary-500">FAQ / 07</div>
      <h3 className="mb-1.5 text-[22px] font-[800] tracking-[-0.01em] text-[#0F1115]">よくあるご質問</h3>
      <div>
        {CONTENT.faq.map((item, i) => (
          <div key={item.q} className="border-[#EEF0F3] border-b py-4">
            <button
              type="button"
              onClick={() => setOpenIndex(openIndex === i ? -1 : i)}
              className="flex w-full cursor-pointer items-start justify-between gap-3 text-left"
            >
              <span className="text-sm font-semibold leading-[1.5] text-[#0F1115]">{item.q}</span>
              <span className="mt-0.5 shrink-0 text-[#6B7280]">{openIndex === i ? <MinusIcon /> : <PlusIcon />}</span>
            </button>
            <div
              className="grid transition-[grid-template-rows] duration-300 ease-in-out"
              style={{ gridTemplateRows: openIndex === i ? "1fr" : "0fr" }}
            >
              <div className="overflow-hidden">
                <div className="pt-2.5 text-[13px] leading-[1.7] text-[#6B7280]">{item.a}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
