import type { ComponentType } from "react";
import { create } from "zustand";
import type { ModalEntry, ModalOptions, ModalStore } from "./types";

/**
 * ユニークIDを生成する
 * シンプルにインクリメントIDを採用（uuidより軽量）
 */
let idCounter = 0;
const generateId = (): string => {
  idCounter += 1;
  return `modal-${idCounter}`;
};

/**
 * デフォルトのモーダルオプション
 */
const defaultOptions: Required<ModalOptions> = {
  scrollLock: true,
  closeOnEsc: true,
  closeOnOverlay: true,
};

/**
 * グローバルモーダルのzustand store
 */
export const useModalStore = create<ModalStore>((set) => ({
  // State
  stack: [],

  // Actions
  openModal: <P extends Record<string, unknown>>(
    Component: ComponentType<P>,
    props?: P,
    options?: ModalOptions,
  ): string => {
    const id = generateId();
    const entry: ModalEntry<P> = {
      id,
      Component,
      props: (props ?? {}) as P,
      options: { ...defaultOptions, ...options },
    };

    set((state) => ({
      stack: [...state.stack, entry as ModalEntry<Record<string, unknown>>],
    }));

    return id;
  },

  closeModal: (): void => {
    set((state) => ({
      stack: state.stack.slice(0, -1),
    }));
  },

  closeById: (id: string): void => {
    set((state) => ({
      stack: state.stack.filter((entry) => entry.id !== id),
    }));
  },

  closeAll: (): void => {
    set({ stack: [] });
  },

  replaceModal: <P extends Record<string, unknown>>(
    Component: ComponentType<P>,
    props?: P,
    options?: ModalOptions,
  ): string => {
    const id = generateId();
    const entry: ModalEntry<P> = {
      id,
      Component,
      props: (props ?? {}) as P,
      options: { ...defaultOptions, ...options },
    };

    set((state) => {
      const typed = entry as ModalEntry<Record<string, unknown>>;
      if (state.stack.length === 0) {
        // スタックが空なら単に追加
        return { stack: [typed] };
      }
      // 最後の要素を差し替え
      return { stack: [...state.stack.slice(0, -1), typed] };
    });

    return id;
  },
}));

// ========================================
// ストア外から呼び出せるヘルパー関数
// ========================================

/**
 * モーダルを開く
 * @returns モーダルID
 */
export function openModal<P extends Record<string, unknown>>(
  Component: ComponentType<P>,
  props?: P,
  options?: ModalOptions,
): string {
  return useModalStore.getState().openModal(Component, props, options);
}

/**
 * 最上位のモーダルを閉じる
 */
export function closeModal(): void {
  useModalStore.getState().closeModal();
}

/**
 * 指定IDのモーダルを閉じる
 */
export function closeById(id: string): void {
  useModalStore.getState().closeById(id);
}

/**
 * 全てのモーダルを閉じる
 */
export function closeAll(): void {
  useModalStore.getState().closeAll();
}

/**
 * 最上位のモーダルを差し替える
 * @returns 新しいモーダルID
 */
export function replaceModal<P extends Record<string, unknown>>(
  Component: ComponentType<P>,
  props?: P,
  options?: ModalOptions,
): string {
  return useModalStore.getState().replaceModal(Component, props, options);
}
