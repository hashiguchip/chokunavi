"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { setAuthUser, trackAuthSuccess } from "@/libs/analytics";
import { useAuthStore } from "@/stores/auth";
import { usePricingStore } from "@/stores/pricing";

type Props = {
  children: React.ReactNode;
};

export function AuthGate({ children }: Props) {
  const { authenticated, source, code: authCode, authenticate } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // persist の復元完了を検知
  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
    }
    return useAuthStore.persist.onFinishHydration(() => setHydrated(true));
  }, []);

  // persist 復元後、認証済みなら GA4 ユーザープロパティをセット
  useEffect(() => {
    if (hydrated && authenticated && source) {
      setAuthUser(source);
    }
  }, [hydrated, authenticated, source]);

  // 認証成功後に単価データを取得
  useEffect(() => {
    if (hydrated && authenticated && authCode) {
      usePricingStore.getState().fetchPricing(authCode);
    }
  }, [hydrated, authenticated, authCode]);

  // ?code= クエリパラメータによる自動認証
  useEffect(() => {
    if (!hydrated || authenticated) return;
    const params = new URLSearchParams(window.location.search);
    const queryCode = params.get("code");
    if (queryCode) {
      authenticate(queryCode).then((source) => {
        if (source) {
          trackAuthSuccess(source);
          // クエリパラメータを消す
          const url = new URL(window.location.href);
          url.searchParams.delete("code");
          window.history.replaceState({}, "", url.toString());
        }
      });
    }
  }, [hydrated, authenticated, authenticate]);

  // フォーム表示時に入力欄にフォーカス
  useEffect(() => {
    if (hydrated && !authenticated) {
      inputRef.current?.focus();
    }
  }, [hydrated, authenticated]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(false);
    setChecking(true);
    const source = await authenticate(code);
    setChecking(false);
    if (source) {
      trackAuthSuccess(source);
    } else {
      setError(true);
    }
  };

  // ハイドレーション前は何も表示しない（フラッシュ防止）
  if (!hydrated) return null;

  if (authenticated) return <>{children}</>;

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 text-center">
        <h1 className="font-semibold text-lg text-neutral-950">紹介コードを入力してください</h1>
        <input
          ref={inputRef}
          type="text"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setError(false);
          }}
          placeholder="紹介コード"
          className="w-full rounded border border-neutral-300 px-3 py-2 text-neutral-950 text-sm outline-none focus:border-primary-500"
        />
        {error && <p className="text-red-600 text-sm">コードが正しくありません。もう一度お試しください。</p>}
        <button
          type="submit"
          disabled={checking || code.length === 0}
          className="w-full rounded bg-primary-600 px-4 py-2 font-medium text-sm text-white hover:bg-primary-700 disabled:opacity-50"
        >
          送信
        </button>
      </form>
    </div>
  );
}
