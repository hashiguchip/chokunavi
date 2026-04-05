import { create } from "zustand";
import { persist } from "zustand/middleware";

interface InterestStore {
  interested: boolean;
  toggle: () => void;
}

export const useInterestStore = create<InterestStore>()(
  persist(
    (set, get) => ({
      interested: false,
      toggle: () => set({ interested: !get().interested }),
    }),
    { name: "interest" },
  ),
);
