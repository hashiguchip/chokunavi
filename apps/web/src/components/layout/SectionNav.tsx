"use client";

import clsx from "clsx";
import { useEffect, useState } from "react";
import { NAV } from "@/constants/navigation";

export function SectionNav() {
  const [active, setActive] = useState("job");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );
    for (const n of NAV) {
      const el = document.getElementById(n.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <div className="sticky top-[56px] z-40 border-[#ddd] border-b bg-white">
      <div className="mx-auto flex max-w-[1220px] overflow-x-auto px-5">
        {NAV.map((n) => (
          <a
            key={n.id}
            href={`#${n.id}`}
            aria-current={active === n.id ? "true" : undefined}
            className={clsx(
              "shrink-0 border-b-[3px] px-5 py-3 text-[13px] transition",
              active === n.id
                ? "border-primary-500 font-bold text-primary-500"
                : "border-transparent text-[#666] hover:text-primary-500",
            )}
          >
            {n.label}
          </a>
        ))}
      </div>
    </div>
  );
}
