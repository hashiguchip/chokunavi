"use client";

import { useEffect, useState } from "react";

export function InterestIndicator() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(Math.floor(Math.random() * 13) + 3);
  }, []);

  if (count === 0) return null;

  return (
    <div className="flex items-start gap-2 border-neutral-200 border-t px-5 py-3 text-neutral-500 text-xs">
      <span className="relative mt-1 flex h-2 w-2 shrink-0">
        <span className="absolute inline-flex h-full w-full rounded-full bg-accent-trial opacity-75 motion-safe:animate-ping" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-trial" />
      </span>
      <span>
        現在 <span className="font-bold text-accent-trial">{count}人</span> がこのエンジニアに興味を持っています
      </span>
    </div>
  );
}
