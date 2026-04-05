export type TechCategory = "language" | "frontend" | "backend" | "infra" | "process" | "ai" | "other";

export type Tech = {
  id: string;
  label: string;
  category: TechCategory;
};

export const TECH_CATEGORY_LABELS: Record<TechCategory, string> = {
  language: "言語",
  frontend: "フロントエンド",
  backend: "バックエンド",
  infra: "インフラ・DevOps",
  process: "開発プロセス",
  ai: "AI",
  other: "その他",
};

// カテゴリ表示順
export const TECH_CATEGORY_ORDER: TechCategory[] = [
  "language",
  "frontend",
  "backend",
  "infra",
  "process",
  "ai",
  "other",
];

export const TECHS: Tech[] = [
  // 言語
  { id: "typescript", label: "TypeScript", category: "language" },
  { id: "javascript", label: "JavaScript", category: "language" },
  { id: "php", label: "PHP", category: "language" },
  { id: "sql", label: "SQL", category: "language" },
  { id: "perl", label: "Perl", category: "language" },
  { id: "java", label: "Java", category: "language" },

  // フロントエンド
  { id: "react", label: "React", category: "frontend" },
  { id: "nextjs", label: "Next.js", category: "frontend" },
  { id: "vue", label: "Vue.js", category: "frontend" },
  { id: "nuxt", label: "Nuxt", category: "frontend" },
  { id: "tailwind", label: "Tailwind CSS", category: "frontend" },
  { id: "sass", label: "Sass/SCSS", category: "frontend" },
  { id: "jest", label: "Jest", category: "frontend" },
  { id: "vite", label: "Vite", category: "frontend" },
  { id: "backbone", label: "Backbone.js", category: "frontend" },
  { id: "jquery", label: "jQuery", category: "frontend" },

  // バックエンド
  { id: "laravel", label: "Laravel", category: "backend" },
  { id: "symfony", label: "Symfony", category: "backend" },
  { id: "cakephp", label: "CakePHP", category: "backend" },
  { id: "codeigniter", label: "CodeIgniter", category: "backend" },
  { id: "zend", label: "Zend Framework", category: "backend" },
  { id: "fuelphp", label: "FuelPHP", category: "backend" },
  { id: "mysql", label: "MySQL", category: "backend" },
  { id: "rest-api", label: "REST API", category: "backend" },
  { id: "wordpress", label: "WordPress", category: "backend" },

  // インフラ・DevOps
  { id: "aws", label: "AWS", category: "infra" },
  { id: "lambda", label: "Lambda", category: "infra" },
  { id: "cdk", label: "CDK", category: "infra" },
  { id: "docker", label: "Docker", category: "infra" },
  { id: "github-actions", label: "GitHub Actions", category: "infra" },
  { id: "vercel", label: "Vercel", category: "infra" },

  // 開発プロセス
  { id: "agile", label: "アジャイル", category: "process" },
  { id: "scrum", label: "スクラム", category: "process" },
  { id: "waterfall", label: "ウォーターフォール", category: "process" },

  // AI
  { id: "claude-code", label: "Claude Code", category: "ai" },
  { id: "cursor", label: "Cursor", category: "ai" },
  { id: "codex", label: "Codex", category: "ai" },
  { id: "gemini", label: "Gemini", category: "ai" },

  // その他
  { id: "git", label: "Git", category: "other" },
  { id: "figma", label: "Figma", category: "other" },
  { id: "notion", label: "Notion", category: "other" },
  { id: "slack", label: "Slack", category: "other" },
  { id: "android", label: "Android", category: "other" },
];

export const TECH_MAP = new Map(TECHS.map((t) => [t.id, t]));
