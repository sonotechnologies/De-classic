"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BRANCH_COOKIE_NAME } from "@/lib/branch-cookie";

const LINKS = [
  { label: "rooms", href: "/rooms" },
  { label: "the bar", href: "/bar" },
  { label: "gallery", href: "/gallery" },
  { label: "offers", href: "/offers" },
  { label: "locations", href: "/locations" },
];

export type HeaderBranch = { slug: string; name: string };

export function SiteHeader({
  branches,
  current,
  phoneHref,
  phoneLabel,
}: {
  branches: HeaderBranch[];
  current: string | null;
  phoneHref: string;
  phoneLabel: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const openRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      openRef.current?.focus();
    };
  }, [open]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-[100] border-b border-line bg-white">
      <div className="wrap flex h-[72px] items-center justify-between gap-6">
        <Link
          href="/"
          aria-label="De Classic Hotel, home"
          className="font-display text-[28px] font-extrabold leading-none tracking-[-0.05em] text-ink no-underline"
        >
          de classic
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-7 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActive(l.href) ? "page" : undefined}
              className={clsx(
                "border-b-2 py-1.5 text-base font-medium text-ink no-underline hover:text-teal",
                isActive(l.href) ? "border-ink" : "border-transparent",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {branches.length > 1 && (
            <span className="hidden md:block">
              <BranchSwitcher branches={branches} current={current} />
            </span>
          )}
          <Link
            href="/book"
            className="inline-flex h-11 items-center rounded-full bg-ink px-[22px] text-[15px] font-semibold text-white no-underline transition-colors duration-[180ms] hover:bg-teal hover:text-white"
          >
            Book now
          </Link>
          <button
            ref={openRef}
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
            className="flex size-11 flex-col items-center justify-center gap-[5px] rounded-full border-[1.5px] border-ink bg-white p-0 md:hidden"
          >
            <span className="block h-0.5 w-4 bg-ink" />
            <span className="block h-0.5 w-4 bg-ink" />
          </button>
        </div>
      </div>

      {open && (
        <div role="dialog" aria-modal="true" aria-label="Menu" className="fixed inset-0 z-[200] flex flex-col overflow-auto bg-aqua px-5 pb-8">
          <div className="flex h-[72px] items-center justify-between">
            <span className="font-display text-[28px] font-extrabold tracking-[-0.05em]">de classic</span>
            <button
              ref={closeRef}
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="size-11 rounded-full border-[1.5px] border-ink bg-transparent text-[22px] leading-none text-ink"
            >
              ×
            </button>
          </div>
          <nav aria-label="Menu" className="mt-8 flex flex-col gap-1">
            {[{ label: "home", href: "/" }, ...LINKS].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                aria-current={(l.href === "/" ? pathname === "/" : isActive(l.href)) ? "page" : undefined}
                className="font-display text-[52px] font-bold leading-[1.05] tracking-[-0.04em] text-ink no-underline"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          {branches.length > 1 && (
            <div className="mt-8">
              <BranchSwitcher branches={branches} current={current} onPicked={() => setOpen(false)} />
            </div>
          )}
          <div className="mt-auto flex flex-col gap-3 pt-10">
            <Link
              href="/book"
              onClick={() => setOpen(false)}
              className="flex h-14 items-center justify-center rounded-full bg-ink text-[17px] font-semibold text-white no-underline"
            >
              Book now
            </Link>
            <a
              href={phoneHref}
              className="flex h-14 items-center justify-center rounded-full border-[1.5px] border-ink text-[17px] font-semibold text-ink no-underline"
            >
              Call {phoneLabel}
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

export function BranchSwitcher({
  branches,
  current,
  onPicked,
}: {
  branches: HeaderBranch[];
  current: string | null;
  onPicked?: () => void;
}) {
  const router = useRouter();
  return (
    <label className="flex h-11 items-center gap-2 rounded-full border-[1.5px] border-line bg-white pl-4 pr-2 text-[15px] focus-within:border-ink">
      <span className="text-[13px] font-semibold text-teal">branch</span>
      <select
        value={current ?? branches[0]?.slug}
        onChange={(e) => {
          document.cookie = `${BRANCH_COOKIE_NAME}=${encodeURIComponent(e.target.value)}; path=/; max-age=31536000; samesite=lax`;
          onPicked?.();
          router.refresh();
        }}
        className="h-full min-w-0 border-0 bg-transparent font-medium text-ink outline-none"
      >
        {branches.map((b) => (
          <option key={b.slug} value={b.slug}>
            {b.name}
          </option>
        ))}
      </select>
    </label>
  );
}
