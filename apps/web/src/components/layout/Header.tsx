"use client";

import { Github } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { NAV } from "@/constants/navigation";
import { posthog } from "@/libs/posthog";

export function Header() {
  const [open, setOpen] = useState(false);
  const handleGithubClick = () => {
    posthog.capture("github_click", { source: "header" });
  };
  return (
    <header className="sticky top-0 z-50 bg-white shadow-[0_2px_4px_rgba(0,0,0,0.08)]">
      <div className="mx-auto flex h-[56px] max-w-[1220px] items-center justify-between px-5">
        <Logo />
        <div className="flex items-center gap-5">
          <nav className="hidden items-center gap-5 text-[13px] text-neutral-950 md:flex">
            {NAV.map((n) => (
              <a key={n.id} href={`#${n.id}`} className="transition hover:text-primary-500">
                {n.label}
              </a>
            ))}
          </nav>
          <a
            href="https://github.com/hashiguchip/chokunavi"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="このサイトの GitHub リポジトリ"
            onClick={handleGithubClick}
            className="hidden items-center gap-1.5 rounded bg-neutral-950 px-2.5 py-1 font-medium text-[12px] text-white transition hover:opacity-85 md:inline-flex"
          >
            <Github size={14} />
            GitHub
          </a>
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
