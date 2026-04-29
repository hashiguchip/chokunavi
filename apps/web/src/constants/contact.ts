import { z } from "zod";

export const CONTACT_CONSULTATION_TYPES = [
  "まずはカジュアルに話したい",
  "業務委託・副業で相談したい",
  "正社員採用で相談したい",
  "募集要件が固まる前に相談したい",
  "その他",
] as const;

export const contactSchema = z.object({
  company: z.string().optional(),
  name: z.string().min(1, "ご担当者名を入力してください"),
  email: z.string().email("メールアドレスの形式が正しくありません"),
  consultationType: z.string().min(1, "ご相談内容を選択してください"),
  message: z.string().min(10, "10文字以上で入力してください"),
  botcheck: z.boolean().optional(),
});

export type ContactFormValues = z.infer<typeof contactSchema>;

export const WEB3FORMS_ENDPOINT = "https://api.web3forms.com/submit";
