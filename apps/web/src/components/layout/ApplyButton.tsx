"use client";

import { clsx } from "clsx";
import { MessageCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { trackContactCtaClick } from "@/libs/analytics";
import { posthog } from "@/libs/posthog";

export function ApplyButton() {
  const slotRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLAnchorElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const prevRectRef = useRef<DOMRect | null>(null);
  const [floating, setFloating] = useState(true);

  // 初回 slide up: Web Animations API で一発だけ動かす (fill: 'none' なので後の FLIP と干渉しない)
  useEffect(() => {
    const el = buttonRef.current;
    if (!el) return;
    el.animate([{ transform: "translateY(100%)" }, { transform: "none" }], {
      duration: 300,
      easing: "ease-out",
      fill: "none",
    });
  }, []);

  // slot を観測: 60% 可視で docked へ、完全に画面下へ抜けたら floating へ
  useEffect(() => {
    const el = slotRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          // slot が 60% 以上可視なら docked、viewport に全く見えないなら floating。
          // 上下どちらに外れても同じ扱い (scroll past、anchor jump のどちらでも矛盾なく復帰)。
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            setFloating(false);
          } else if (!entry.isIntersecting) {
            setFloating(true);
          }
        }
      },
      { threshold: [0, 0.6], rootMargin: "0px 0px -80px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // FLIP: floating が切り替わる前後の bounding rect を測って、
  // 変形前→現在位置への逆 transform を compositor で animate。初回レンダーは prev 記録のみ。
  // biome-ignore lint/correctness/useExhaustiveDependencies: effect は floating の遷移をトリガに発火するため、値そのものは参照しないが dep は必須
  useLayoutEffect(() => {
    const el = buttonRef.current;
    if (!el) return;
    const prev = prevRectRef.current;
    const curr = el.getBoundingClientRect();
    prevRectRef.current = curr;
    if (!prev) return;

    const dx = prev.left - curr.left;
    const dy = prev.top - curr.top;
    const sx = curr.width === 0 ? 1 : prev.width / curr.width;
    const sy = curr.height === 0 ? 1 : prev.height / curr.height;

    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5 && Math.abs(sx - 1) < 0.01 && Math.abs(sy - 1) < 0.01) {
      return;
    }

    const duration = 400;
    const easing = "cubic-bezier(0.83, 0, 0.17, 1)";

    // 外側 (button): FLIP の通常 transform
    el.animate(
      [
        { transformOrigin: "top left", transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` },
        { transformOrigin: "top left", transform: "none" },
      ],
      { duration, easing, fill: "none" },
    );

    // 内側 (text): 外側の scale を打ち消す counter-scale。同じ timing/easing で同時再生して
    // 任意 t で外 × 内 = 1 を成立させ、text 等倍を保つ (classic FLIP counter-scale テクニック)
    textRef.current?.animate([{ transform: `scale(${1 / sx}, ${1 / sy})` }, { transform: "none" }], {
      duration,
      easing,
      fill: "none",
    });
  }, [floating]);

  return (
    <div ref={slotRef} className="relative mx-auto h-11 w-full max-w-sm">
      <Link
        ref={buttonRef}
        href="/contact"
        onClick={() => {
          const location = floating ? "floating-cta" : "footer";
          trackContactCtaClick(location);
          posthog.capture("apply_click", { location });
          posthog.capture("contact_cta_click", { location });
        }}
        aria-label="このエンジニアに話を聞く"
        className={clsx(
          "flex items-center justify-center bg-primary-500 text-white transition-colors hover:bg-primary-700 focus-visible:outline-2 focus-visible:outline-offset-2",
          floating
            ? "fixed right-0 bottom-0 left-0 z-30 h-[68px] pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_8px_rgba(0,0,0,0.12)] focus-visible:outline-white"
            : "absolute inset-0 rounded font-bold text-base focus-visible:outline-primary-500",
        )}
      >
        <span ref={textRef} className="inline-flex items-center justify-center gap-2">
          {floating && <MessageCircle size={18} aria-hidden="true" className="shrink-0" />}
          <span className="flex flex-col items-start leading-tight">
            {floating && <span className="font-normal text-[11px] text-white/80">条件未定でもOK</span>}
            <span className="font-bold text-base">このエンジニアに話を聞く</span>
          </span>
        </span>
      </Link>
    </div>
  );
}
