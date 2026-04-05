import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AUTH_CODES } from "@/constants/auth";

async function sha256(text: string): Promise<string> {
  const encoded = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

interface AuthStore {
  authenticated: boolean;
  source: string | null;
  code: string | null;
  authenticate: (code: string) => Promise<string | null>;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      authenticated: false,
      source: null,
      code: null,
      authenticate: async (code: string) => {
        const hash = await sha256(code);
        const source = AUTH_CODES[hash] ?? null;
        if (source) {
          set({ authenticated: true, source, code });
        }
        return source;
      },
      logout: () => set({ authenticated: false, source: null, code: null }),
    }),
    { name: "auth" },
  ),
);
