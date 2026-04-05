import type { ComponentType } from "react";

/**
 * モーダルのオプション設定
 */
export interface ModalOptions {
  /** body のスクロールをロックするか (default: true) */
  scrollLock?: boolean;
  /** ESCキーで閉じるか (default: true) */
  closeOnEsc?: boolean;
  /** オーバーレイクリックで閉じるか (default: true) */
  closeOnOverlay?: boolean;
}

/**
 * スタックに積まれるモーダルエントリ
 */
export interface ModalEntry<P = Record<string, unknown>> {
  /** 一意のID */
  id: string;
  /** モーダルコンポーネント */
  Component: ComponentType<P>;
  /** コンポーネントに渡すprops */
  props: P;
  /** オプション */
  options: Required<ModalOptions>;
}

/**
 * zustand storeの状態型
 */
export interface ModalState {
  /** モーダルスタック（末尾が最上位） */
  stack: ModalEntry<Record<string, unknown>>[];
}

/**
 * zustand storeのアクション型
 */
export interface ModalActions {
  /** モーダルを開く（スタックに追加） */
  openModal: <P extends Record<string, unknown>>(
    Component: ComponentType<P>,
    props?: P,
    options?: ModalOptions,
  ) => string;

  /** 最上位のモーダルを閉じる */
  closeModal: () => void;

  /** 指定IDのモーダルを閉じる */
  closeById: (id: string) => void;

  /** 全てのモーダルを閉じる */
  closeAll: () => void;

  /** 最上位のモーダルを差し替える */
  replaceModal: <P extends Record<string, unknown>>(
    Component: ComponentType<P>,
    props?: P,
    options?: ModalOptions,
  ) => string;
}

export type ModalStore = ModalState & ModalActions;
