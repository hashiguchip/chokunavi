"use client";

import { ApplyButton } from "@/components/layout/ApplyButton";
import { showDummyPopover } from "@/utils/showDummyPopover";

export function Contact() {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    showDummyPopover(e.currentTarget);
  };

  return (
    <section id="contact" className="bg-white px-5 py-14">
      <div className="mx-auto max-w-[1220px]">
        <div className="rounded border border-neutral-300 bg-white text-center">
          <div className="border-neutral-200 border-b bg-primary-500 px-5 py-4">
            <h2 className="font-bold text-lg text-white">お問い合わせ</h2>
          </div>
          <div className="px-5 py-8">
            <p className="mb-6 text-neutral-800 text-sm">
              ご興味をお持ちの方は、下記よりお気軽にお問い合わせください。
            </p>
            <div className="mb-3">
              <ApplyButton />
            </div>
            <p className="mb-6 text-[11px] text-neutral-500">※ ご連絡から面談まで最短即日で対応いたします</p>
            <div className="flex justify-center gap-5 text-[13px]">
              <a href="https://github.com/hashiguchip/chokunavi" className="text-primary-500 underline">
                GitHub
              </a>
              <button type="button" className="cursor-pointer text-primary-500 underline" onClick={handleClick}>
                LinkedIn
              </button>
              <button type="button" className="cursor-pointer text-primary-500 underline" onClick={handleClick}>
                Instagram
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
