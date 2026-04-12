"use client";

import { useEffect, useRef } from "react";
import { posthog } from "./client";

export function useSectionViewTracker(sectionIds: string[]): void {
  const viewedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !viewedRef.current.has(entry.target.id)) {
            viewedRef.current.add(entry.target.id);
            posthog.capture("section_view", { section_id: entry.target.id });
          }
        }
      },
      { threshold: 0.3 },
    );

    for (const id of sectionIds) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [sectionIds]);
}
