"use client";

import { useRef } from "react";
import type { FieldErrors, UseFormReturn } from "react-hook-form";
import { CONTACT_CONSULTATION_TYPES, type ContactFormValues } from "@/constants/contact";
import { trackContactInputStart, trackContactValidationError } from "@/libs/analytics";
import { posthog } from "@/libs/posthog";

type Props = {
  form: UseFormReturn<ContactFormValues>;
  onNext: () => void;
};

export function ContactFormStep({ form, onNext }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;
  const inputStartedRef = useRef(false);

  const handleInputStart = () => {
    if (inputStartedRef.current) return;
    inputStartedRef.current = true;
    trackContactInputStart();
    posthog.capture("contact_input_start");
  };

  const handleValidationError = (formErrors: FieldErrors<ContactFormValues>) => {
    const fields = Object.keys(formErrors);
    trackContactValidationError(fields);
    posthog.capture("contact_validation_error", { fields });
  };

  return (
    <form onSubmit={handleSubmit(onNext, handleValidationError)} onFocusCapture={handleInputStart} noValidate>
      {/* honeypot */}
      <input
        type="checkbox"
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        {...register("botcheck")}
      />

      <div className="space-y-6">
        <div className="rounded border border-primary-100 bg-primary-50 px-4 py-3 text-[13px] text-neutral-800 leading-relaxed">
          <p>求人票や条件が固まっていなくても大丈夫です。</p>
          <p className="mt-1">稼働時期・契約形態・気になっている点など、簡単にお送りください。</p>
        </div>

        <div>
          <label htmlFor="company" className="mb-1 block font-bold text-[13px] text-neutral-950">
            会社名・組織名
            <span className="ml-2 font-normal text-[11px] text-neutral-500">任意</span>
          </label>
          <input
            id="company"
            type="text"
            className="w-full rounded border border-neutral-300 px-3 py-2 text-neutral-950 text-sm outline-none focus:border-primary-500"
            placeholder="例）株式会社○○"
            {...register("company")}
          />
        </div>

        <div>
          <label htmlFor="name" className="mb-1 block font-bold text-[13px] text-neutral-950">
            ご担当者名
            <span className="ml-2 text-[11px] text-red-500">必須</span>
          </label>
          <input
            id="name"
            type="text"
            className="w-full rounded border border-neutral-300 px-3 py-2 text-neutral-950 text-sm outline-none focus:border-primary-500"
            placeholder="例）山田 太郎"
            {...register("name")}
          />
          {errors.name && <p className="mt-1 text-red-500 text-xs">{errors.name.message}</p>}
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block font-bold text-[13px] text-neutral-950">
            返信先メールアドレス
            <span className="ml-2 text-[11px] text-red-500">必須</span>
          </label>
          <input
            id="email"
            type="email"
            className="w-full rounded border border-neutral-300 px-3 py-2 text-neutral-950 text-sm outline-none focus:border-primary-500"
            placeholder="例）example@company.com"
            {...register("email")}
          />
          {errors.email && <p className="mt-1 text-red-500 text-xs">{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="consultationType" className="mb-1 block font-bold text-[13px] text-neutral-950">
            ご相談内容
            <span className="ml-2 text-[11px] text-red-500">必須</span>
          </label>
          <select
            id="consultationType"
            className="w-full rounded border border-neutral-300 bg-white px-3 py-2 text-neutral-950 text-sm outline-none focus:border-primary-500"
            {...register("consultationType")}
          >
            <option value="">選択してください</option>
            {CONTACT_CONSULTATION_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          {errors.consultationType && <p className="mt-1 text-red-500 text-xs">{errors.consultationType.message}</p>}
        </div>

        <div>
          <label htmlFor="message" className="mb-1 block font-bold text-[13px] text-neutral-950">
            メッセージ・補足
            <span className="ml-2 text-[11px] text-red-500">必須</span>
          </label>
          <textarea
            id="message"
            rows={6}
            className="w-full resize-y rounded border border-neutral-300 px-3 py-2 text-neutral-950 text-sm outline-none focus:border-primary-500"
            placeholder="例）プロダクト開発まわりで一度カジュアルにお話しできないかと思い、ご連絡しました。まだ詳細は固まっていませんが、まずは相談できると嬉しいです。"
            {...register("message")}
          />
          {errors.message && <p className="mt-1 text-red-500 text-xs">{errors.message.message}</p>}
        </div>
      </div>

      <div className="mt-8 text-center">
        <button
          type="submit"
          className="w-full max-w-sm cursor-pointer rounded bg-primary-500 py-4 font-bold text-base text-white transition hover:bg-primary-700"
        >
          内容を確認する
        </button>
      </div>
    </form>
  );
}
