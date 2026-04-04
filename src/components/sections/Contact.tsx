"use client";

import Link from "next/link";
import { showDummyPopover } from "@/utils/showDummyPopover";

export function Contact() {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    showDummyPopover(e.currentTarget);
  };

  return (
    <section id="contact" className="bg-white px-5 py-14">
      <div className="mx-auto max-w-[1220px]">
        <div className="rounded border border-[#ddd] bg-white text-center">
          <div className="border-[#eee] border-b bg-primary-500 px-5 py-4">
            <h2 className="font-bold text-[18px] text-white">応募方法</h2>
          </div>
          <div className="px-5 py-8">
            <p className="mb-6 text-[#555] text-[14px]">
              ご興味をお持ちの方は、下記よりお気軽にお問い合わせください。
              <br />
              書類選考なし・カジュアル面談歓迎です。
            </p>
            <Link
              href="/contact"
              className="mb-3 inline-block w-full max-w-sm rounded bg-primary-500 py-4 font-bold text-[16px] text-white transition hover:bg-primary-700"
            >
              応募フォームへ進む
            </Link>
            <p className="mb-6 text-[#999] text-[11px]">※ 応募から面談まで最短即日で対応いたします</p>
            <div className="flex justify-center gap-5 text-[13px]">
              <a href="https://github.com/hashiguchip" className="text-primary-500 underline">
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
