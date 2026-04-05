"use client";

import { Heart } from "lucide-react";
import { openModal } from "@/libs/global-modal";
import { useInterestStore } from "@/stores/interest";
import { ThankYouModal } from "./ThankYouModal";

export function InterestButton() {
  const { interested, toggle } = useInterestStore();

  const handleClick = () => {
    toggle();
    if (!interested) {
      openModal(ThankYouModal);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={interested}
      className={`flex w-full items-center justify-center gap-1.5 rounded border px-5 py-3 text-[13px] transition sm:w-auto ${
        interested
          ? "border-[#e06060] bg-[#e06060]/8 text-[#e06060]"
          : "border-[#ccc] bg-white text-[#666] hover:border-primary-500 hover:text-primary-500"
      }`}
    >
      <Heart size={16} fill={interested ? "currentColor" : "none"} />
      {interested ? "気になる済み" : "気になる"}
    </button>
  );
}
