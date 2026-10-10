import { Skeleton } from "@/components/ui/bits";

/** Loading state for public pages: flat aqua-tint blocks that pulse, no shimmer. */
export function PageSkeleton({ variant = "cards" }: { variant?: "cards" | "gallery" | "form" }) {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="border-b border-line bg-white">
        <div className="wrap flex h-[72px] items-center justify-between">
          <span className="font-display text-[28px] font-extrabold tracking-[-0.05em]">de classic</span>
          <span className="inline-flex h-11 items-center rounded-full bg-ink px-[22px] text-[15px] font-semibold text-white">Book now</span>
        </div>
      </div>
      {variant === "form" ? (
        <div className="mx-auto flex max-w-[640px] flex-col gap-5 px-5 pt-[clamp(40px,6vw,72px)]">
          <Skeleton className="h-4 w-40 rounded-md" />
          <Skeleton className="h-16 w-4/5 rounded-lg" />
          <Skeleton className="h-14 w-full rounded-card" />
          <Skeleton className="h-14 w-full rounded-card" />
          <Skeleton className="h-40 w-full rounded-frame" />
        </div>
      ) : (
        <>
          <div className="bg-aqua pb-24 pt-[clamp(40px,6vw,80px)]">
            <div className="wrap">
              <div className="h-[clamp(48px,8vw,116px)] w-3/5 rounded-lg bg-white/50" />
            </div>
          </div>
          <div className="wrap -mt-16 grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-6 pb-24">
            {Array.from({ length: 3 }).map((_, i) =>
              variant === "gallery" ? (
                <Skeleton key={i} className="rounded-frame" style={{ aspectRatio: i === 1 ? "1/1" : "3/2" }} />
              ) : (
                <div key={i} className="flex flex-col gap-3.5">
                  <Skeleton className="rounded-frame" style={{ aspectRatio: "4/5" }} />
                  <Skeleton className="h-[26px] w-[70%] rounded-lg" />
                  <Skeleton className="h-4 w-[90%] rounded-md" />
                </div>
              ),
            )}
          </div>
        </>
      )}
    </div>
  );
}
