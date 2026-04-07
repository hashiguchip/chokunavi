import { MailCheck } from "lucide-react";
import Link from "next/link";

export function ContactCompleteStep() {
  return (
    <div className="text-center">
      <MailCheck size={48} className="mx-auto mb-6 text-primary-500" />
      <h3 className="mb-4 font-bold text-lg text-neutral-950">送信が完了しました</h3>
      <p className="mb-2 text-neutral-800 text-sm">お問い合わせいただきありがとうございます。</p>
      <p className="mb-8 text-neutral-800 text-sm">内容を確認の上、折り返しご連絡いたします。</p>
      <Link
        href="/"
        className="inline-block rounded border border-primary-500 px-8 py-3 font-bold text-primary-500 text-sm transition hover:bg-primary-50"
      >
        トップに戻る
      </Link>
    </div>
  );
}
