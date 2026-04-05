"use client";

import { useRef, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { ContactFormValues } from "@/constants/contact";
import { env } from "@/env";
import { trackContactSubmitError } from "@/libs/analytics";
import { api } from "@/services/api";

type Props = {
  form: UseFormReturn<ContactFormValues>;
  onBack: () => void;
  onComplete: () => void;
};

const FIELD_LABELS: { key: Exclude<keyof ContactFormValues, "botcheck">; label: string }[] = [
  { key: "company", label: "会社名・組織名" },
  { key: "name", label: "お名前" },
  { key: "email", label: "メールアドレス" },
  { key: "message", label: "お問い合わせ内容" },
];

export function ContactConfirmStep({ form, onBack, onComplete }: Props) {
  const values = form.getValues();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submittingRef = useRef(false);

  const handleSubmit = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setError(null);

    const { company, ...rest } = values;
    const result = await api.contact({
      access_key: env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY,
      ...rest,
      ...(company ? { company } : {}),
    });

    submittingRef.current = false;
    setSubmitting(false);

    if (!result.ok) {
      setError("送信に失敗しました。時間をおいて再度お試しください。");
      trackContactSubmitError("submission_failed");
      return;
    }

    onComplete();
  };

  return (
    <div>
      <p className="mb-6 text-center text-[#555] text-[14px]">入力内容をご確認ください。</p>

      <dl className="divide-y divide-[#eee] rounded border border-[#ddd]">
        {FIELD_LABELS.map(({ key, label }) => {
          const value = values[key];
          if (key === "company" && !value) return null;
          return (
            <div key={key} className="px-4 py-3 sm:flex">
              <dt className="mb-1 font-bold text-[#333] text-[13px] sm:mb-0 sm:w-40 sm:shrink-0">{label}</dt>
              <dd className="whitespace-pre-wrap text-[#555] text-[14px]">{value}</dd>
            </div>
          );
        })}
      </dl>

      {error && (
        <p className="mt-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-600">{error}</p>
      )}

      <div className="mt-8 flex flex-col items-center gap-3">
        <button
          type="button"
          disabled={submitting}
          onClick={handleSubmit}
          className="w-full max-w-sm cursor-pointer rounded bg-primary-500 py-4 font-bold text-[16px] text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "送信中..." : "送信する"}
        </button>
        <button
          type="button"
          disabled={submitting}
          onClick={onBack}
          className="cursor-pointer text-[13px] text-primary-500 underline disabled:cursor-not-allowed disabled:opacity-50"
        >
          修正する
        </button>
      </div>
    </div>
  );
}
