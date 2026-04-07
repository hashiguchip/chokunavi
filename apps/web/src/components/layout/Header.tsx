"use client";

import { useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { NAV } from "@/constants/navigation";

export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 bg-white shadow-[0_2px_4px_rgba(0,0,0,0.08)]">
      <div className="mx-auto flex h-[56px] max-w-[1220px] items-center justify-between px-5">
        <Logo />
        <nav className="hidden items-center gap-5 text-[13px] text-neutral-950 md:flex">
          {NAV.map((n) => (
            <a key={n.id} href={`#${n.id}`} className="transition hover:text-primary-500">
              {n.label}
            </a>
          ))}
          <a
            href="#contact"
            className="rounded bg-accent-trial px-4 py-2 font-bold text-white text-xs transition hover:opacity-85"
          >
            まずは話を聞く
          </a>
        </nav>
        <button
          type="button"
          className="text-[20px] md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="メニュー"
          aria-expanded={open}
        >
          {open ? "✕" : "☰"}
        </button>
      </div>
      {open && (
        <nav className="border-neutral-200 border-t bg-white px-5 py-2 md:hidden">
          {NAV.map((n) => (
            <a
              key={n.id}
              href={`#${n.id}`}
              className="block py-2 text-neutral-950 text-sm"
              onClick={() => setOpen(false)}
            >
              {n.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
