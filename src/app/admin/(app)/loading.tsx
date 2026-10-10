import { TableSkeleton, TitleSkeleton } from "@/components/admin/skeletons";

export default function Loading() {
  return (
    <>
      <TitleSkeleton />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,160px),1fr))] gap-3">
        {["New requests", "Today's arrivals", "Requests this week"].map((l, i) => (
          <div key={l} className={`rounded-card border-line flex flex-col gap-1.5 border p-[18px] ${i === 0 ? "bg-aqua" : ""}`}>
            <span className="text-sm">{l}</span>
            <span className="text-slate text-4xl leading-none font-bold">–</span>
          </div>
        ))}
      </div>
      <TableSkeleton />
    </>
  );
}
