"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { setAuthUser, trackAuthSuccess } from "@/libs/analytics";
import { posthog } from "@/libs/posthog";
import { useAppDataStore } from "@/stores/app-data";
import { useAuthStore } from "@/stores/auth";

type Props = {
  children: React.ReactNode;
};

export function AuthGate({ children }: Props) {
  const persistedCode = useAuthStore((s) => s.code);
  const setPersistedCode = useAuthStore((s) => s.setCode);
  const clearPersistedCode = useAuthStore((s) => s.clearCode);

  const data = useAppDataStore((s) => s.data);
  const loading = useAppDataStore((s) => s.loading);
  const error = useAppDataStore((s) => s.error);

  const [hydrated, setHydrated] = useState(false);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const fetchedRef = useRef(false);
  const phFiredRef = useRef(false);

  // persist の復元完了を検知
  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
    }
    return useAuthStore.persist.onFinishHydration(() => setHydrated(true));
  }, []);

  // hydration 完了後に 1 度だけ fetch する。?code= を優先。
  useEffect(() => {
    if (!hydrated || fetchedRef.current) return;

    const params = new URLSearchParams(window.location.search);
    const queryCode = params.get("code");

    if (queryCode) {
      fetchedRef.current = true;
      setPersistedCode(queryCode);
      useAppDataStore
        .getState()
        .fetch(queryCode)
        .then(() => {
          const url = new URL(window.location.href);
          url.searchParams.delete("code");
          window.history.replaceState({}, "", url.toString());
        });
      return;
    }

    if (persistedCode) {
      fetchedRef.current = true;
      useAppDataStore.getState().fetch(persistedCode);
    }
  }, [hydrated, persistedCode, setPersistedCode]);

  useEffect(() => {
    if (data && persistedCode) {
      setAuthUser(persistedCode);
      if (!phFiredRef.current) {
        posthog.register({ auth_source: persistedCode });
        posthog.capture("auth_success", { auth_source: persistedCode });
        phFiredRef.current = true;
      }
    }
  }, [data, persistedCode]);

  // 401 を受けたら持っていたコードを破棄してフォームに戻す
  useEffect(() => {
    if (error?.type === "http" && error.status === 401 && persistedCode) {
      clearPersistedCode();
    }
  }, [error, persistedCode, clearPersistedCode]);

  // フォーム表示時に入力欄にフォーカス
  useEffect(() => {
    if (hydrated && !data && !loading) {
      inputRef.current?.focus();
    }
  }, [hydrated, data, loading]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (input.length === 0) return;
    setPersistedCode(input);
    await useAppDataStore.getState().fetch(input);
    if (useAppDataStore.getState().data) {
      trackAuthSuccess(input);
    }
  };

  const handleRetry = () => {
    if (persistedCode) {
      useAppDataStore.getState().fetch(persistedCode);
    }
  };

  // ハイドレーション前は何も表示しない（フラッシュ防止）
  if (!hydrated) return null;

  // ローディング中（持っているコードで自動 fetch 中、または submit 後）
  if (loading) {
    return <Spinner fullscreen className="bg-white" />;
  }

  // 認証成功
  if (data) return <>{children}</>;

  const isAuthError = error?.type === "http" && error.status === 401;
  const isNetworkError = error && error.type !== "http";
  const isOtherHttpError = error?.type === "http" && error.status !== 401;

  // ネットワーク・サーバエラー (再試行可能) — 持っていたコードがある場合のみ
  if ((isNetworkError || isOtherHttpError) && persistedCode) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4">
        <div className="w-full max-w-sm space-y-4 text-center">
          <h1 className="font-semibold text-lg text-neutral-950">接続できません</h1>
          <p className="text-neutral-700 text-sm">サーバーに接続できませんでした。しばらく待って再試行してください。</p>
          <button
            type="button"
            onClick={handleRetry}
            className="w-full rounded bg-primary-600 px-4 py-2 font-medium text-sm text-white hover:bg-primary-700"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 text-center">
        <h1 className="font-semibold text-lg text-neutral-950">紹介コードを入力してください</h1>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="紹介コード"
          className="w-full rounded border border-gray-300 px-3 py-2 text-neutral-950 text-sm outline-none focus:border-primary-500"
        />
        {isAuthError && <p className="text-red-600 text-sm">コードが正しくありません。もう一度お試しください。</p>}
        {isNetworkError && !persistedCode && <p className="text-red-600 text-sm">サーバーに接続できませんでした。</p>}
        <button
          type="submit"
          disabled={loading || input.length === 0}
          className="w-full rounded bg-primary-600 px-4 py-2 font-medium text-sm text-white hover:bg-primary-700 disabled:opacity-50"
        >
          送信
        </button>
      </form>
    </div>
  );
}
