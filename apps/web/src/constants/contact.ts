import { z } from "zod";

export const contactSchema = z.object({
  company: z.string().optional(),
  name: z.string().min(1, "お名前を入力してください"),
  email: z.string().email("メールアドレスの形式が正しくありません"),
  message: z.string().min(10, "10文字以上で入力してください"),
  botcheck: z.boolean().optional(),
});

export type ContactFormValues = z.infer<typeof contactSchema>;

export const WEB3FORMS_ENDPOINT = "https://api.web3forms.com/submit";
