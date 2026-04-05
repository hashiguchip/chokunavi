"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { closeById, closeModal, useModalStore } from "./store";
import type { ModalEntry } from "./types";

interface GlobalModalHostProps {
  /**
   * 全てのモーダルをレンダリングするか
   * false: 最上位のみ表示（デフォルト）
   * true: 全てレンダリング（z-indexで積み上げ）
   */
  renderAll?: boolean;
}

/**
 * モーダルをレンダリングするホストコンポーネント
 * root layout に配置してください
 */
export function GlobalModalHost({ renderAll = false }: GlobalModalHostProps): React.ReactNode {
  const stack = useModalStore((state) => state.stack);
  const [mounted, setMounted] = useState(false);

  // SSR対応: クライアントでのみマウント
  useEffect(() => {
    setMounted(true);
  }, []);

  // scrollLock の管理（スクロールバー幅を補正してレイアウトシフトを防止）
  useEffect(() => {
    if (!mounted) return;

    const hasScrollLock = stack.some((entry) => entry.options.scrollLock);

    if (hasScrollLock) {
      // スクロールバーの幅を計算
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

      const originalOverflow = document.body.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;

      document.body.style.overflow = "hidden";
      // スクロールバー分のpadding-rightを追加してレイアウトシフトを防止
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
      };
    }
  }, [stack, mounted]);

  // ESCキーハンドラ
  useEffect(() => {
    if (!mounted || stack.length === 0) return;

    const topModal = stack[stack.length - 1];
    if (!topModal?.options.closeOnEsc) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeModal();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [stack, mounted]);

  // SSR / 初期マウント前は何も描画しない
  if (!mounted || stack.length === 0) {
    return null;
  }

  // レンダリング対象を決定
  const modalsToRender = renderAll ? stack : [stack[stack.length - 1]];

  return createPortal(
    modalsToRender.map((entry, index) => <ModalRenderer key={entry.id} entry={entry} zIndex={1000 + index} />),
    document.body,
  );
}

interface ModalRendererProps {
  entry: ModalEntry<Record<string, unknown>>;
  zIndex: number;
}

/**
 * 個々のモーダルをレンダリングするコンポーネント
 */
function ModalRenderer({ entry, zIndex }: ModalRendererProps): React.ReactNode {
  const { id, Component, props, options } = entry;
  const [isVisible, setIsVisible] = useState(false);

  // マウント時にアニメーション開始
  useEffect(() => {
    // 次のフレームでvisibleにしてアニメーション発火
    const timer = requestAnimationFrame(() => {
      setIsVisible(true);
    });
    return () => cancelAnimationFrame(timer);
  }, []);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      // オーバーレイ自体がクリックされた場合のみ閉じる
      if (e.target === e.currentTarget && options.closeOnOverlay) {
        closeById(id);
      }
    },
    [id, options.closeOnOverlay],
  );

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: ESCキー操作は親のuseEffectで処理済み
    <div
      className="fixed inset-0 flex items-center justify-center transition-colors duration-200"
      style={{
        zIndex,
        backgroundColor: isVisible ? "rgba(0, 0, 0, 0.5)" : "rgba(0, 0, 0, 0)",
      }}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
    >
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: stopPropagationのみ、キーボード操作不要 */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: イベント伝播防止用ラッパー */}
      <div
        className="relative transition-opacity duration-200"
        style={{
          opacity: isVisible ? 1 : 0,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Component {...props} />
      </div>
    </div>
  );
}
