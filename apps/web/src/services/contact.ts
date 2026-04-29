import { z } from "zod";
import { type ContactFormValues, WEB3FORMS_ENDPOINT } from "@/constants/contact";
import { createHttpClient, Result } from "@/libs/http";

const http = createHttpClient();

const web3ResponseSchema = z.object({ success: z.boolean() });

/** 相談フォームを送信する。provider が success: false を返した場合も http エラーに統合する */
export async function submitContact(body: ContactFormValues & { access_key: string }) {
  const result = await http.post(WEB3FORMS_ENDPOINT, body, {
    schema: web3ResponseSchema,
  });
  if (result.ok && !result.data.success) {
    return Result.err({ type: "http", status: 200, message: "Submission rejected by provider" });
  }
  return result;
}
