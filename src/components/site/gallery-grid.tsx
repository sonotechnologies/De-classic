"use client";

import clsx from "clsx";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { BuildingDrawing } from "@/components/ui/bits";

export type GalleryPhoto = {
  id: string;
  url: string;
  alt: string;
  tag: "rooms" | "bar" | "exterior";
  width: number;
  height: number;
};

const FILTERS = ["all", "rooms", "bar", "exterior"] as const;
type Filter = (typeof FILTERS)[number];

/** Filter pills, a mixed-ratio grid and a full-screen viewer. Filters swap instantly; the viewer opens with no transition. */
export function GalleryGrid({ photos, heading }: { photos: GalleryPhoto[]; heading: React.ReactNode }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [viewing, setViewing] = useState(-1);
  const list = photos.filter((p) => filter === "all" || p.tag === filter);
  const hasExteriorPhoto = photos.some((p) => p.tag === "exterior");
  const showDrawing = !hasExteriorPhoto && (filter === "all" || filter === "exterior");
  const closeRef = useRef<HTMLButtonElement>(null);
  const lastTrigger = useRef<HTMLElement | null>(null);

  const close = useCallback(() => {
    setViewing(-1);
    lastTrigger.current?.focus();
  }, []);
  const step = useCallback((d: number) => setViewing((v) => (v + d + list.length) % list.length), [list.length]);

  useEffect(() => {
    if (viewing < 0) return;
    closeRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [viewing, close, step]);

  // Swipe left/right in the viewer on phones.
  const touchX = useRef<number | null>(null);
  const current = list[viewing];

  return (
    <>
      <section className="wrap flex flex-wrap items-end justify-between gap-6 pt-[clamp(40px,6vw,80px)]">
        {heading}
        <div role="group" aria-label="Filter photos" className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => {
                setFilter(f);
                setViewing(-1);
              }}
              className={clsx(
                "border-ink h-11 rounded-full border-[1.5px] px-5 text-[15px] font-semibold",
                filter === f ? "bg-ink text-white" : "text-ink bg-white",
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </section>

      <section className="wrap pt-10 pb-[clamp(72px,9vw,128px)]">
        <div className="[columns:3_280px] [column-gap:16px]">
          {list.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={(e) => {
                lastTrigger.current = e.currentTarget;
                setViewing(i);
              }}
              aria-label={`Open photo: ${p.alt}`}
              className="rounded-frame bg-aqua-tint mb-4 block w-full cursor-zoom-in [break-inside:avoid] overflow-hidden border-0 p-0"
            >
              <Image
                src={p.url}
                alt={p.alt}
                width={p.width}
                height={p.height}
                sizes="(min-width: 1240px) 400px, (min-width: 760px) 33vw, 100vw"
                className="block h-auto w-full"
              />
            </button>
          ))}
          {showDrawing && (
            <>
              <div className="mb-4 [break-inside:avoid]">
                <BuildingDrawing />
              </div>
              <p className="text-slate mt-0 mb-4 [break-inside:avoid] text-[15px] leading-[1.6]">
                Exterior photos come once the building is shot in daylight. This is a drawing of it until then.
              </p>
            </>
          )}
          {list.length === 0 && !showDrawing && <p className="text-slate m-0 text-[17px]">No photos here yet.</p>}
        </div>
      </section>

      {current && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Photo viewer"
          className="fixed inset-0 z-[300] flex flex-col bg-white"
          onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchX.current == null) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
            touchX.current = null;
          }}
        >
          <div className="flex h-[72px] items-center justify-between px-[clamp(20px,4vw,40px)]">
            <span className="text-teal text-sm font-semibold" aria-live="polite">
              {viewing + 1} of {list.length}
            </span>
            <button
              ref={closeRef}
              type="button"
              onClick={close}
              aria-label="Close viewer"
              className="border-ink text-ink size-11 rounded-full border-[1.5px] bg-white text-[22px]"
            >
              ×
            </button>
          </div>
          <div className="relative min-h-0 flex-1 px-[clamp(20px,4vw,40px)]">
            <div className="relative size-full">
              <Image src={current.url} alt={current.alt} fill sizes="100vw" className="rounded-frame object-contain" />
            </div>
          </div>
          <div className="flex h-24 items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous photo"
              className="border-ink text-ink h-12 rounded-full border-[1.5px] bg-white px-6 text-[15px] font-semibold"
            >
              ← Previous
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next photo"
              className="bg-ink h-12 rounded-full border-0 px-6 text-[15px] font-semibold text-white"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </>
  );
}
