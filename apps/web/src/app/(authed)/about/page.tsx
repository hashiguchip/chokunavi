import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { AboutHero } from "./_components/AboutHero";
import { Movement } from "./_components/Movement";
import { Problem } from "./_components/Problem";
import { Stance } from "./_components/Stance";
import { WhatWeDo } from "./_components/WhatWeDo";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-surface-warm text-slate-700">
      <Header minimal />
      <div className="mx-auto md:max-w-5xl lg:max-w-7xl">
        <AboutHero />
        <Problem />
        <Stance />
        <WhatWeDo />
        <Movement />
      </div>
      <Footer />
    </div>
  );
}
