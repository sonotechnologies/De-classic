import clsx from "clsx";
import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";

/** Small lowercase deep-teal label, e.g. "the bar · from". */
export function Label({ children, className, gold }: { children: ReactNode; className?: string; gold?: boolean }) {
  return <span className={clsx("block text-sm font-semibold", gold ? "text-gold" : "text-teal", className)}>{children}</span>;
}

/** Round black price sticker, tilted; pops in with a spin as it appears. */
export function Sticker({
  size = 84,
  tilt = 8,
  tiltHover = 18,
  top,
  main,
  bottom = "per night",
  className,
  style,
}: {
  size?: number;
  tilt?: number;
  tiltHover?: number;
  top?: string;
  main: string;
  bottom?: string | null;
  className?: string;
  style?: CSSProperties;
}) {
  const big = size >= 96;
  return (
    <div
      data-sticker=""
      aria-hidden="true"
      className={clsx("sticker flex flex-col items-center justify-center rounded-full bg-ink text-white", className)}
      style={{ width: size, height: size, ["--tilt" as string]: `${tilt}deg`, ["--tilt-hover" as string]: `${tilt < 0 ? -tiltHover : tiltHover}deg`, ...style }}
    >
      {top && <span className="text-[11px] font-semibold">{top}</span>}
      <span className={clsx("font-display font-extrabold leading-none tracking-[-0.04em]", big ? "text-[26px]" : "text-[22px]")}>{main}</span>
      {bottom && <span className={clsx("font-semibold", big ? "text-[11px]" : "text-[10px]")}>{bottom}</span>}
    </div>
  );
}

/** Rounded "window frame" photo with a fixed aspect ratio so real photos drop in without breaking layouts. */
export function Frame({
  src,
  alt,
  ratio = "4/5",
  sizes,
  priority,
  className,
  dark,
  rounded = "rounded-frame",
}: {
  src?: string | null;
  alt: string;
  ratio?: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  dark?: boolean;
  rounded?: string;
}) {
  return (
    <div className={clsx("relative overflow-hidden", rounded, dark ? "bg-[#222]" : "bg-aqua-tint", className)} style={{ aspectRatio: ratio }}>
      {src ? (
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center p-4 text-center text-[13px] text-slate">Photo coming soon</span>
      )}
    </div>
  );
}

/** Flat drawing of the aqua and white building, used until a daylight exterior photo exists. */
export function BuildingDrawing({ className }: { className?: string }) {
  return (
    <div
      role="img"
      aria-label="Drawing of the aqua and white hotel building"
      className={clsx("relative flex items-end justify-center overflow-hidden rounded-frame bg-aqua px-[12%]", className)}
      style={{ aspectRatio: "3/2" }}
    >
      <div className="absolute inset-x-0 bottom-0 h-[22%] bg-white" />
      <div className="relative grid h-[70%] w-[62%] grid-cols-4 grid-rows-3 gap-[10%] rounded-t-[6px] border-[3px] border-b-0 border-ink bg-white px-[8%] pt-[8%]">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-[6px] border-2 border-ink bg-aqua" />
        ))}
        <div className="col-span-2 col-start-2 rounded-t-[6px] bg-ink" />
      </div>
    </div>
  );
}

/** Yellow "Sample" tag for placeholder content in the admin. */
export function SampleTag({ className }: { className?: string }) {
  return (
    <span className={clsx("inline-block rounded-[6px] bg-sample px-1.5 py-px text-xs font-semibold text-sample-ink", className)}>Sample</span>
  );
}

/** Flat aqua-tint loading block; opacity pulses 0.6 → 1 every 1.2s, no shimmer. */
export function Skeleton({ className, style, soft }: { className?: string; style?: CSSProperties; soft?: boolean }) {
  return <div aria-hidden="true" className={clsx("animate-pulse-soft", soft ? "bg-line-soft" : "bg-aqua-tint", className)} style={style} />;
}
