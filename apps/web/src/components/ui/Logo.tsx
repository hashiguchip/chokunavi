import Link from "next/link";

function SwooshMark() {
  return (
    <svg width="80" height="28" viewBox="0 0 80 28" fill="currentColor" aria-hidden="true">
      {/* リクナビ × ナイキ融合スウッシュ — 超横長・激太 */}
      <path d="M0 18C4 12 14 18 24 24c6 3 16 3 26-3 10-6 18-14 30-21-3 8-9 18-19 24-7 4-15 6-24 5-10-1-20-8-27-11C5 15 1.5 15.5 0 18z" />
    </svg>
  );
}

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-1 no-underline">
      {/* スウッシュマーク */}
      <span className="text-primary-500">
        <SwooshMark />
      </span>
      {/* ワードマーク */}
      <span className="font-extrabold font-rounded text-[13px] text-primary-500 leading-none tracking-wide">
        チョクナビ
      </span>
    </Link>
  );
}
