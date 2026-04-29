"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import clsx from "clsx";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { ContactCompleteStep } from "@/components/contact/ContactCompleteStep";
import { ContactConfirmStep } from "@/components/contact/ContactConfirmStep";
import { ContactFormStep } from "@/components/contact/ContactFormStep";
import { type ContactFormValues, contactSchema } from "@/constants/contact";
import { trackContactComplete, trackContactConfirm } from "@/libs/analytics";
import { posthog } from "@/libs/posthog";

type Step = "input" | "confirm" | "complete";

export function ContactPage() {
  const [step, setStep] = useState<Step>("input");
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      company: "",
      name: "",
      email: "",
      consultationType: "",
      message: "",
    },
  });

  return (
    <section className="bg-neutral-100 px-3 py-8 sm:px-5 sm:py-14">
      <div className="mx-auto max-w-[640px]">
        <div className="rounded border border-neutral-300 bg-white">
          <div className="border-neutral-200 border-b bg-primary-500 px-5 py-4">
            <h1 className="text-center font-bold text-lg text-white">
              {step === "complete" ? "送信完了" : "まずは分かる範囲でご連絡ください"}
            </h1>
          </div>

          {step !== "complete" && (
            <div className="flex border-neutral-200 border-b text-center text-[13px]">
              <div
                className={clsx(
                  "flex-1 py-3 font-bold",
                  step === "input" ? "bg-primary-50 text-primary-600" : "text-neutral-500",
                )}
              >
                1. 入力
              </div>
              <div
                className={clsx(
                  "flex-1 py-3 font-bold",
                  step === "confirm" ? "bg-primary-50 text-primary-600" : "text-neutral-500",
                )}
              >
                2. 確認
              </div>
              <div className="flex-1 py-3 font-bold text-neutral-500">3. 完了</div>
            </div>
          )}

          <div className="h-1 bg-neutral-200">
            <div
              className="h-1 bg-primary-500 transition-all duration-500 ease-in-out"
              style={{ width: step === "input" ? "33.3%" : step === "confirm" ? "66.6%" : "100%" }}
            />
          </div>

          <div className="px-4 py-6 sm:px-5 sm:py-8">
            {step === "input" && (
              <ContactFormStep
                form={form}
                onNext={() => {
                  trackContactConfirm();
                  posthog.capture("contact_confirm");
                  setStep("confirm");
                }}
              />
            )}
            {step === "confirm" && (
              <ContactConfirmStep
                form={form}
                onBack={() => setStep("input")}
                onComplete={() => {
                  trackContactComplete();
                  posthog.capture("contact_complete");
                  setStep("complete");
                }}
              />
            )}
            {step === "complete" && <ContactCompleteStep />}
          </div>
        </div>
      </div>
    </section>
  );
}
