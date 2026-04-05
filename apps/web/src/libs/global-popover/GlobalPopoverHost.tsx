"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { closePopover, usePopoverStore } from "./store";

type Position = {
  top: number;
  left: number;
  arrowLeft: number;
  resolvedPosition: "top" | "bottom";
};

/**
 * ポップオーバーをレンダリングするホストコンポーネント
 * root layout に配置してください
 */
export function GlobalPopoverHost(): React.ReactNode {
  const current = usePopoverStore((s) => s.current);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !current) return null;

  return createPortal(
    <PopoverRenderer
      key={current.id}
      content={current.content}
      anchor={current.anchor}
      duration={current.duration}
      position={current.position}
    />,
    document.body,
  );
}

type PopoverRendererProps = {
  content: React.ReactNode;
  anchor: HTMLElement;
  duration: number;
  position: "top" | "bottom";
};

function PopoverRenderer({ content, anchor, duration, position }: PopoverRendererProps): React.ReactNode {
  const [isVisible, setIsVisible] = useState(false);
  const [pos, setPos] = useState<Position | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  // 位置を計算
  const updatePosition = useCallback(() => {
    const el = popoverRef.current;
    if (!el) return;

    const anchorRect = anchor.getBoundingClientRect();
    const popoverRect = el.getBoundingClientRect();
    const arrowSize = 6;
    const gap = 4;
    const viewportPadding = 8;

    // 上に収まるか判定し、収まらなければ下にフォールバック
    const topCandidate = anchorRect.top - popoverRect.height - arrowSize - gap;
    const bottomCandidate = anchorRect.bottom + arrowSize + gap;

    let actualPosition: "top" | "bottom";
    let top: number;
    if (position === "top" && topCandidate < viewportPadding) {
      actualPosition = "bottom";
      top = bottomCandidate;
    } else if (position === "bottom" && bottomCandidate + popoverRect.height > window.innerHeight - viewportPadding) {
      actualPosition = "top";
      top = topCandidate;
    } else {
      actualPosition = position;
      top = position === "top" ? topCandidate : bottomCandidate;
    }

    // 水平中央寄せ + はみ出し防止
    const anchorCenterX = anchorRect.left + anchorRect.width / 2;
    const rawLeft = anchorCenterX - popoverRect.width / 2;
    const clampedLeft = Math.max(
      viewportPadding,
      Math.min(rawLeft, window.innerWidth - popoverRect.width - viewportPadding),
    );

    // 矢印の位置（ポップオーバー左端からの相対X）
    const arrowLeft = anchorCenterX - clampedLeft;

    setPos({ top, left: clampedLeft, arrowLeft, resolvedPosition: actualPosition });
  }, [anchor, position]);

  // マウント時に位置計算 → フェードイン
  useEffect(() => {
    updatePosition();
    const raf = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(raf);
  }, [updatePosition]);

  // 自動消滅
  const dismiss = useCallback(() => {
    setIsVisible(false);
    timerRef.current = setTimeout(() => closePopover(), 200);
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    timerRef.current = setTimeout(dismiss, duration);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isVisible, duration, dismiss]);

  const isTop = pos?.resolvedPosition === "top" || (!pos && position === "top");

  return (
    <div
      ref={popoverRef}
      className="fixed z-[1100] max-w-[260px] rounded-lg border border-[#555] bg-[#444] px-4 py-3 text-[#eee] text-[12px] shadow-lg transition-[opacity,transform] duration-200"
      style={{
        top: pos?.top ?? -9999,
        left: pos?.left ?? -9999,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : `translateY(${isTop ? "4px" : "-4px"})`,
      }}
    >
      {content}
      {/* 矢印 */}
      {pos && (
        <div
          className={`absolute ${isTop ? "bottom-0 translate-y-full" : "top-0 -translate-y-full"}`}
          style={{ left: pos.arrowLeft }}
        >
          {/* 外枠（ボーダー色） */}
          <div
            className={`ml-[-6px] border-[6px] border-transparent ${isTop ? "border-t-[#555]" : "border-b-[#555]"}`}
          />
          {/* 内側（背景色） */}
          <div
            className={`absolute ml-[-5px] border-[5px] border-transparent ${
              isTop ? "top-0 border-t-[#444]" : "bottom-0 border-b-[#444]"
            }`}
          />
        </div>
      )}
    </div>
  );
}
