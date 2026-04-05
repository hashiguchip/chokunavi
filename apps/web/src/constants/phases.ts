export type Phase = {
  id: string;
  label: string;
};

export const PHASES: Phase[] = [
  { id: "requirements", label: "要件定義" },
  { id: "basic-design", label: "基本設計" },
  { id: "detailed-design", label: "詳細設計" },
  { id: "development", label: "製造" },
  { id: "testing", label: "試験" },
  { id: "maintenance", label: "運用・保守" },
];

export const PHASE_MAP = new Map(PHASES.map((p) => [p.id, p]));
