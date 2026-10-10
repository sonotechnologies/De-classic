import { Skeleton } from "@/components/ui/bits";

const widths = [
  ["70%", "55%"],
  ["55%", "65%"],
  ["80%", "50%"],
  ["60%", "60%"],
];

/** Reservations-style table placeholder: soft blocks that pulse, no shimmer. */
export function TableSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading" className="rounded-card border-line overflow-hidden border">
      <Skeleton className="h-11" />
      {widths.map(([a, b], i) => (
        <div key={i} className="border-line grid grid-cols-[1.4fr_1.2fr_1fr_110px] items-center gap-4 border-t px-[18px] py-4">
          <Skeleton soft className="h-3.5 rounded-md" style={{ width: a }} />
          <Skeleton soft className="h-3.5 rounded-md" style={{ width: b }} />
          <Skeleton soft className="h-3.5 w-3/5 rounded-md" />
          <Skeleton soft className="h-[22px] w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function TitleSkeleton() {
  return <Skeleton soft className="h-8 w-48 rounded-lg" />;
}
