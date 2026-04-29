export type NavItem = {
  id: string;
  label: string;
};

export const NAV: NavItem[] = [
  { id: "job", label: "エンジニア情報" },
  { id: "skills", label: "スキル" },
  { id: "projects", label: "実績" },
  { id: "requirements", label: "希望条件" },
  { id: "conditions", label: "稼働条件" },
  { id: "faq", label: "FAQ" },
  { id: "pain-points", label: "お困りごと" },
  { id: "contact", label: "相談" },
];
