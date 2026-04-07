import clsx from "clsx";

export function DLRow({ label, children, first }: { label: string; children: React.ReactNode; first?: boolean }) {
  return (
    <div className={clsx("flex border-neutral-200 border-b", first && "border-t")}>
      <div className="w-[140px] shrink-0 bg-neutral-100 px-4 py-3 font-semibold text-[13px] text-neutral-950 md:w-[160px]">
        {label}
      </div>
      <div className="flex-1 px-4 py-3 text-neutral-950 text-sm">{children}</div>
    </div>
  );
}
