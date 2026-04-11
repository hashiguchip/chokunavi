import { clsx } from "clsx";

type Props = {
  /** スピナーのサイズ */
  size?: "sm" | "md" | "lg" | "xl";
  /** カラーバリエーション */
  color?: "primary" | "neutral" | "white";
  /** トラック（背景リング）を表示するか */
  track?: boolean;
  /** スピナー下に表示するラベル */
  label?: string;
  /** フルスクリーン中央配置 */
  fullscreen?: boolean;
  /** 追加クラス（外側の wrapper に適用） */
  className?: string;
};

const sizeMap = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-4",
  lg: "h-12 w-12 border-4",
  xl: "h-16 w-16 border-[5px]",
} as const;

const colorMap = {
  primary: { ring: "border-t-primary-500", track: "border-primary-200" },
  neutral: { ring: "border-t-neutral-600", track: "border-neutral-200" },
  white: { ring: "border-t-white", track: "border-white/25" },
} as const;

const labelSizeMap = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-sm",
  xl: "text-base",
} as const;

const labelColorMap = {
  primary: "text-primary-600",
  neutral: "text-neutral-600",
  white: "text-white",
} as const;

export function Spinner({ size = "md", color = "primary", track = true, label, fullscreen = false, className }: Props) {
  const spinner = (
    <output
      className={clsx(
        "block animate-spin rounded-full",
        sizeMap[size],
        colorMap[color].ring,
        track ? colorMap[color].track : "border-transparent",
      )}
      aria-label={label ?? "読み込み中"}
    />
  );

  if (fullscreen) {
    return (
      <div className={clsx("flex min-h-screen flex-col items-center justify-center gap-3", className)}>
        {spinner}
        {label && <p className={clsx(labelSizeMap[size], labelColorMap[color])}>{label}</p>}
      </div>
    );
  }

  if (label) {
    return (
      <div className={clsx("inline-flex flex-col items-center gap-2", className)}>
        {spinner}
        <p className={clsx(labelSizeMap[size], labelColorMap[color])}>{label}</p>
      </div>
    );
  }

  return className ? <div className={className}>{spinner}</div> : spinner;
}
