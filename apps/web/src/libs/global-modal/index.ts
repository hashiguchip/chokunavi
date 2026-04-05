// Components
export { GlobalModalHost } from "./GlobalModalHost";
// Actions (store外から呼び出し可能)
// Store (hooks用)
export {
  closeAll,
  closeById,
  closeModal,
  openModal,
  replaceModal,
  useModalStore,
} from "./store";

// Types
export type {
  ModalActions,
  ModalEntry,
  ModalOptions,
  ModalState,
  ModalStore,
} from "./types";
