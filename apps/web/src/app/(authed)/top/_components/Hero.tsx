import Image from "next/image";
import { CONTENT } from "../_constants/content";

export function Hero() {
  return (
    <div className="relative">
      <Image
        src="/top/hero.png"
        alt=""
        width={800}
        height={520}
        className="h-[520px] w-full object-cover object-[70%_center] lg:h-auto lg:aspect-[16/9] lg:max-h-[70vh] lg:object-[70%_30%]"
        priority
      />
      <div className="absolute inset-0 [background:linear-gradient(180deg,transparent_30%,rgba(0,0,0,0.3)_100%)]" />
      <div className="absolute top-9 right-5 left-5 flex flex-col gap-3.5">
        <h1 className="whitespace-pre-line text-4xl font-[900] leading-[1.2] tracking-[-0.01em] text-white lg:text-[56px]">
          {CONTENT.heroCopy}
        </h1>
        <p className="text-[13px] leading-[1.7] text-white/92">{CONTENT.heroSub}</p>
      </div>
    </div>
  );
}
