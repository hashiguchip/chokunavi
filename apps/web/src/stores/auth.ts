import { create } from "zustand";
import { persist } from "zustand/middleware";

// 認証コードの保持のみを担う store。
// 「認証済みかどうか」は app-data store の data が non-null か (= API が 200 を返したか) で判定する。
// 旧実装ではローカル SHA-256 照合で UI を切り替えていたが、データは HTML に焼かれていて
// view-source で全部見える「演劇」だった。真実の出所を API に一本化した。

type AuthStore = {
  code: string | null;
  setCode: (code: string) => void;
  clearCode: () => void;
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      code: null,
      setCode: (code: string) => set({ code }),
      clearCode: () => set({ code: null }),
    }),
    { name: "auth" },
  ),
);
