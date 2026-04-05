import type { ReactNode } from "react";

/**
 * ポップオーバーを開くときのオプション
 */
export interface PopoverOptions {
  /** 表示するコンテンツ（テキストでもJSXでもOK） */
  content: ReactNode;
  /** 位置の基準となる要素 */
  anchor: HTMLElement;
  /** 自動消滅までのミリ秒 (default: 3000) */
  duration?: number;
  /** 表示位置 (default: "top") */
  position?: "top" | "bottom";
}

/**
 * ストアに保持されるポップオーバーエントリ
 */
export interface PopoverEntry {
  id: string;
  content: ReactNode;
  anchor: HTMLElement;
  duration: number;
  position: "top" | "bottom";
}

/**
 * zustand storeの状態型
 */
export interface PopoverState {
  /** 現在表示中のポップオーバー（1つだけ） */
  current: PopoverEntry | null;
}

/**
 * zustand storeのアクション型
 */
export interface PopoverActions {
  /** ポップオーバーを表示する */
  showPopover: (options: PopoverOptions) => string;
  /** ポップオーバーを閉じる */
  closePopover: () => void;
}

export type PopoverStore = PopoverState & PopoverActions;
