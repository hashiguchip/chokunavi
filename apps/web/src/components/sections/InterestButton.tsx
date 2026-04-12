"use client";

import clsx from "clsx";
import { Heart } from "lucide-react";
import { openModal } from "@/libs/global-modal";
import { posthog } from "@/libs/posthog";
import { useInterestStore } from "@/stores/interest";
import { ThankYouModal } from "./ThankYouModal";

export function InterestButton() {
  const { interested, toggle } = useInterestStore();

  const handleClick = () => {
    toggle();
    if (!interested) {
      posthog.capture("interest_click");
      openModal(ThankYouModal);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={interested}
      className={clsx(
        "flex w-full items-center justify-center gap-1.5 rounded border px-5 py-3 text-[13px] transition sm:w-auto",
        interested
          ? "border-accent-interest bg-accent-interest/8 text-accent-interest"
          : "border-neutral-300 bg-white text-neutral-700 hover:border-primary-500 hover:text-primary-500",
      )}
    >
      <Heart size={16} fill={interested ? "currentColor" : "none"} />
      {interested ? "気になる済み" : "気になる"}
    </button>
  );
}
