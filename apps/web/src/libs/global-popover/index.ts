// Components
export { GlobalPopoverHost } from "./GlobalPopoverHost";
// Actions（store外から呼び出し可能）
export { closePopover, showPopover, usePopoverStore } from "./store";

// Types
export type {
  PopoverActions,
  PopoverEntry,
  PopoverOptions,
  PopoverState,
  PopoverStore,
} from "./types";
