"use client";

import AutoScroll from "embla-carousel-auto-scroll";
import useEmblaCarousel from "embla-carousel-react";
import { UserCircle } from "lucide-react";
import Link from "next/link";
import { CONTENT } from "../_constants/content";

export function Engineers() {
  const [emblaRef] = useEmblaCarousel({ loop: true, dragFree: true }, [
    AutoScroll({ speed: 0.8, stopOnInteraction: false }),
  ]);

  return (
    <section className="py-8">
      <div className="mx-auto px-5 md:max-w-5xl lg:max-w-7xl">
        <div className="mb-2.5 font-mono text-[10px] tracking-[2px] text-primary-500">ENGINEERS / 02</div>
        <h3 className="mb-2 text-[22px] font-[800] tracking-[-0.01em] text-[#0F1115]">
          登録エンジニアはすべてミドルクラス以上
        </h3>
        <p className="mb-5 text-[13px] text-[#6B7280]">
          気になるエンジニアをクリックして、詳しいプロフィールをチェック
        </p>
      </div>
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="-ml-3 flex">
          {CONTENT.engineers.map((eng) => (
            <div key={eng.name} className="min-w-0 shrink-0 grow-0 basis-[160px] pl-3 lg:basis-[200px]">
              <Link
                href="/"
                className="flex flex-col items-center rounded-2xl border border-[#EEF0F3] bg-white p-5 no-underline transition hover:border-primary-500"
              >
                <UserCircle size={48} className="mb-3 text-[#6B7280]" />
                <div className="mb-2 text-sm font-bold text-[#0F1115]">{eng.name}</div>
                <div className="text-[10px] font-semibold tracking-wider text-[#6B7280]">保有スキル</div>
                <div className="mt-1 flex flex-wrap justify-center gap-1">
                  {eng.skills.map((s) => (
                    <span
                      key={s}
                      className="rounded-md bg-primary-50 px-2 py-0.5 text-[11px] font-medium text-primary-500"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
