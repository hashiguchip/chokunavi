"use client";

import { Github } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { NAV } from "@/constants/navigation";
import { useScrollActivity } from "@/hooks/useScrollActivity";
import { posthog } from "@/libs/posthog";

type Props = {
  minimal?: boolean;
};

function SourceBubble({ visible, mobileMenuOpen }: { visible: boolean; mobileMenuOpen: boolean }) {
  return (
    <span
      className="source-bubble absolute top-full right-0 mt-1.5 whitespace-nowrap rounded bg-primary-500 px-2.5 py-1 font-bold text-[11px] text-white shadow-[0_2px_8px_rgba(0,0,0,0.18)] transition group-hover:bg-primary-700"
      data-mobile-menu={mobileMenuOpen ? "open" : "closed"}
      data-state={visible ? "visible" : "hidden"}
      aria-hidden="true"
    >
      <span className="absolute -top-1 right-3 h-2 w-2 rotate-45 bg-primary-500 transition group-hover:bg-primary-700" />
      View Source
    </span>
  );
}

export function Header({ minimal = false }: Props) {
  const [open, setOpen] = useState(false);
  const [sourceLinkHovered, setSourceLinkHovered] = useState(false);
  const [sourceLinkFocused, setSourceLinkFocused] = useState(false);
  const scrollActive = useScrollActivity();
  const bubbleVisible = scrollActive || sourceLinkHovered || sourceLinkFocused;

  return (
    <header className="sticky top-0 z-50 bg-white shadow-[0_2px_4px_rgba(0,0,0,0.08)]">
      <div className="mx-auto flex h-[56px] max-w-[1220px] items-center justify-between px-5">
        <Logo />
        <div className="flex items-center gap-5">
          {!minimal && (
            <>
              <nav className="hidden items-center gap-5 text-body-small text-neutral-950 md:flex">
                {NAV.map((n) => (
                  <a key={n.id} href={`#${n.id}`} className="transition hover:text-primary-500">
                    {n.label}
                  </a>
                ))}
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
            </>
          )}
          <a
            href="https://github.com/hashiguchip/chokunavi"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub でこのサイトのソースコードを見る"
            onClick={() => posthog.capture("github_click", { label: "view_source", source: "header" })}
            onFocus={() => setSourceLinkFocused(true)}
            onBlur={() => setSourceLinkFocused(false)}
            onMouseEnter={() => setSourceLinkHovered(true)}
            onMouseLeave={() => setSourceLinkHovered(false)}
            className="group relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-neutral-950 text-white transition hover:opacity-85 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          >
            <Github size={17} aria-hidden="true" />
            <SourceBubble visible={bubbleVisible} mobileMenuOpen={open} />
          </a>
        </div>
      </div>
      {!minimal && open && (
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
