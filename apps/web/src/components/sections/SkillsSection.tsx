import { H2 } from "@/components/ui/H2";

const SKILL_CATEGORIES = [
  { label: "言語", items: ["TypeScript", "JavaScript", "PHP", "SQL"] },
  {
    label: "フロントエンド",
    items: ["React", "Next.js", "Vue.js", "Nuxt.js", "Tailwind CSS", "Sass/SCSS", "Jest", "Vite"],
  },
  {
    label: "バックエンド",
    items: ["Laravel", "Symfony", "CakePHP", "CodeIgniter", "Zend Framework", "FuelPHP", "MySQL", "REST API"],
  },
  {
    label: "インフラ・DevOps",
    items: ["AWS", "Lambda", "CDK", "Docker", "GitHub Actions", "Vercel"],
  },
  {
    label: "開発プロセス",
    items: ["アジャイル", "スクラム", "ウォーターフォール"],
  },
  { label: "AI", items: ["Claude Code", "Cursor", "Codex", "Gemini"] },
  { label: "その他", items: ["Git", "Figma", "Notion", "Slack"] },
];

export function SkillsSection() {
  return (
    <section id="skills" className="bg-white px-5 pb-10">
      <div className="mx-auto max-w-[1220px]">
        <H2>スキル・技術スタック</H2>
        <div className="rounded border border-neutral-300 bg-white p-5">
          <div className="space-y-3">
            {SKILL_CATEGORIES.map((c) => (
              <div key={c.label} className="flex flex-col gap-2 sm:flex-row sm:items-baseline">
                <span className="w-[140px] shrink-0 font-bold text-[13px] text-neutral-900">{c.label}</span>
                <div className="flex flex-wrap gap-1.5">
                  {c.items.map((s) => (
                    <span
                      key={s}
                      className="rounded-sm bg-neutral-100 px-2.5 py-1 text-neutral-800 text-xs ring-1 ring-neutral-200"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
