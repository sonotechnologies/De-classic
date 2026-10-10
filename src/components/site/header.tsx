"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
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
    const opener = openRef.current;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      opener?.focus();
    };
  }, [open]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="border-line sticky top-0 z-[100] border-b bg-white">
      <div className="wrap flex h-[72px] items-center justify-between gap-6">
        <Link
          href="/"
          aria-label="De Classic Hotel, home"
          className="font-display text-ink text-[28px] leading-none font-extrabold tracking-[-0.05em] no-underline"
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
                "text-ink hover:text-teal border-b-2 py-1.5 text-base font-medium no-underline",
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
            className="bg-ink hover:bg-teal inline-flex h-11 items-center rounded-full px-[22px] text-[15px] font-semibold text-white no-underline transition-colors duration-[180ms] hover:text-white"
          >
            Book now
          </Link>
          <button
            ref={openRef}
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
            className="border-ink flex size-11 flex-col items-center justify-center gap-[5px] rounded-full border-[1.5px] bg-white p-0 md:hidden"
          >
            <span className="bg-ink block h-0.5 w-4" />
            <span className="bg-ink block h-0.5 w-4" />
          </button>
        </div>
      </div>

      {open && (
        <div role="dialog" aria-modal="true" aria-label="Menu" className="bg-aqua fixed inset-0 z-[200] flex flex-col overflow-auto px-5 pb-8">
          <div className="flex h-[72px] items-center justify-between">
            <span className="font-display text-[28px] font-extrabold tracking-[-0.05em]">de classic</span>
            <button
              ref={closeRef}
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="border-ink text-ink size-11 rounded-full border-[1.5px] bg-transparent text-[22px] leading-none"
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
                className="font-display text-ink text-[52px] leading-[1.05] font-bold tracking-[-0.04em] no-underline"
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
              className="bg-ink flex h-14 items-center justify-center rounded-full text-[17px] font-semibold text-white no-underline"
            >
              Book now
            </Link>
            <a
              href={phoneHref}
              className="border-ink text-ink flex h-14 items-center justify-center rounded-full border-[1.5px] text-[17px] font-semibold no-underline"
            >
              Call {phoneLabel}
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

export function BranchSwitcher({ branches, current, onPicked }: { branches: HeaderBranch[]; current: string | null; onPicked?: () => void }) {
  const router = useRouter();
  const uid = useId();
  return (
    <label className="border-line focus-within:border-ink flex h-11 items-center gap-2 rounded-full border-[1.5px] bg-white pr-2 pl-4 text-[15px]">
      <span id={`${uid}-branch`} className="text-teal text-[13px] font-semibold">
        branch
      </span>
      <select
        aria-labelledby={`${uid}-branch`}
        value={current ?? branches[0]?.slug}
        onChange={(e) => {
          document.cookie = `${BRANCH_COOKIE_NAME}=${encodeURIComponent(e.target.value)}; path=/; max-age=31536000; samesite=lax`;
          onPicked?.();
          router.refresh();
        }}
        className="text-ink h-full min-w-0 border-0 bg-transparent font-medium outline-none"
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
