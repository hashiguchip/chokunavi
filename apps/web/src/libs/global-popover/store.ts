import { create } from "zustand";
import type { PopoverEntry, PopoverOptions, PopoverStore } from "./types";

let idCounter = 0;
const generateId = (): string => {
  idCounter += 1;
  return `popover-${idCounter}`;
};

const defaultDuration = 1000;
const defaultPosition = "top" as const;

/**
 * グローバルポップオーバーの zustand store
 */
export const usePopoverStore = create<PopoverStore>((set) => ({
  current: null,

  showPopover: (options: PopoverOptions): string => {
    const id = generateId();
    const entry: PopoverEntry = {
      id,
      content: options.content,
      anchor: options.anchor,
      duration: options.duration ?? defaultDuration,
      position: options.position ?? defaultPosition,
    };
    set({ current: entry });
    return id;
  },

  closePopover: (): void => {
    set({ current: null });
  },
}));

/**
 * ポップオーバーを表示する
 * @returns ポップオーバーID
 */
export function showPopover(options: PopoverOptions): string {
  return usePopoverStore.getState().showPopover(options);
}

/**
 * ポップオーバーを閉じる
 */
export function closePopover(): void {
  usePopoverStore.getState().closePopover();
}
