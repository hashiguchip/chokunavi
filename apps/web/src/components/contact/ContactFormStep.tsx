"use client";

import type { UseFormReturn } from "react-hook-form";
import type { ContactFormValues } from "@/constants/contact";

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

  return (
    <form onSubmit={handleSubmit(onNext)} noValidate>
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
            お名前
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
            メールアドレス
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
          <label htmlFor="message" className="mb-1 block font-bold text-[13px] text-neutral-950">
            お問い合わせ内容
            <span className="ml-2 text-[11px] text-red-500">必須</span>
          </label>
          <textarea
            id="message"
            rows={6}
            className="w-full resize-y rounded border border-neutral-300 px-3 py-2 text-neutral-950 text-sm outline-none focus:border-primary-500"
            placeholder="ご質問・ご相談内容をご記入ください"
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
          確認画面へ
        </button>
      </div>
    </form>
  );
}
