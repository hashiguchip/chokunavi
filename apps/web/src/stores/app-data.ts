import { create } from "zustand";
import type { HttpError } from "@/libs/http";
import { type AppData, getAppData } from "@/services/api/app-data";

type AppDataStore = {
  data: AppData | null;
  loading: boolean;
  error: HttpError | null;
  fetch: (code: string) => Promise<void>;
  reset: () => void;
};

export const useAppDataStore = create<AppDataStore>()((set) => ({
  data: null,
  loading: false,
  error: null,
  fetch: async (code: string) => {
    set({ loading: true, error: null });
    const result = await getAppData(code);
    if (result.ok) {
      set({ data: result.data, loading: false, error: null });
    } else {
      set({ data: null, loading: false, error: result.error });
    }
  },
  reset: () => set({ data: null, loading: false, error: null }),
}));
