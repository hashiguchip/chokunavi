import clsx from "clsx";

export function DLRow({ label, children, first }: { label: string; children: React.ReactNode; first?: boolean }) {
  return (
    <div className={clsx("flex border-[#eee] border-b", first && "border-t")}>
      <div className="w-[140px] shrink-0 bg-[#f5f5f5] px-4 py-3 font-semibold text-[#333] text-[13px] md:w-[160px]">
        {label}
      </div>
      <div className="flex-1 px-4 py-3 text-[#333] text-[14px]">{children}</div>
    </div>
  );
}
