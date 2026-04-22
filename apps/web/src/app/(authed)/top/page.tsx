import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { About } from "./_components/About";
import { Engineers } from "./_components/Engineers";
import { Faq } from "./_components/Faq";
import { Features } from "./_components/Features";
import { Flow } from "./_components/Flow";
import { Hero } from "./_components/Hero";
import { Pricing } from "./_components/Pricing";
import { Voices } from "./_components/Voices";

export default function TopPage() {
  return (
    <div className="min-h-screen bg-surface-warm text-slate-700">
      <Header minimal />
      <Hero />
      <div className="mx-auto md:max-w-5xl lg:max-w-7xl">
        <About />
      </div>
      <Engineers />
      <div className="mx-auto md:max-w-5xl lg:max-w-7xl">
        <Features />
        <Voices />
        <Pricing />
        <Flow />
        <Faq />
      </div>
      <Footer />
    </div>
  );
}
