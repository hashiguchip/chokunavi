import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-5 text-[#333]">
      <p className="font-bold text-[120px] text-primary-500 leading-none md:text-[180px]">404</p>
      <p className="mt-4 font-bold text-[18px] md:text-[22px]">このポジションは見つかりませんでした</p>
      <p className="mt-2 text-[#888] text-[14px]">お探しのページは存在しないか、移動した可能性があります。</p>
      <Link
        href="/"
        className="mt-8 rounded bg-primary-500 px-6 py-3 font-bold text-[14px] text-white transition hover:opacity-85"
      >
        トップページへ戻る
      </Link>
    </div>
  );
}
