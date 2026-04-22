import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { SectionNav } from "@/components/layout/SectionNav";
import { Contact } from "@/components/sections/Contact";
import { FAQ } from "@/components/sections/FAQ";
import { JobInfo } from "@/components/sections/JobInfo";
import { PainPoints } from "@/components/sections/PainPoints";
import { Projects } from "@/components/sections/Projects";
import { Requirements } from "@/components/sections/Requirements";
import { SkillsSection } from "@/components/sections/SkillsSection";
import { WorkConditions } from "@/components/sections/WorkConditions";

export default function Page() {
  return (
    <>
      <Breadcrumb />
      <SectionNav />
      <JobInfo />
      <SkillsSection />
      <Projects />
      <Requirements />
      <WorkConditions />
      <FAQ />
      <PainPoints />
      <Contact />
    </>
  );
}
