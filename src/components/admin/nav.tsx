"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = { label: string; href: string; count?: number };

function active(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(href + "/");
}

export function Sidebar({ items, footer }: { items: NavItem[]; footer: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <aside className="border-line sticky top-0 hidden h-svh w-60 flex-none flex-col gap-0.5 overflow-auto border-r px-3 py-5 md:flex">
      <div className="flex flex-col gap-0.5 px-3 pt-1 pb-5">
        <span className="font-display text-2xl leading-none font-extrabold tracking-[-0.05em]">de classic</span>
        <span className="text-slate text-[13px]">Admin</span>
      </div>
      <nav aria-label="Admin" className="flex flex-col gap-0.5">
        {items.map((n) => {
          const on = active(pathname, n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              aria-current={on ? "page" : undefined}
              className={clsx(
                "text-ink hover:bg-aqua-tint hover:text-ink flex h-10 items-center justify-between rounded-[10px] px-3 text-[15px] no-underline",
                on ? "bg-aqua font-semibold" : "font-medium",
              )}
            >
              <span>{n.label}</span>
              {!!n.count && <span className="bg-ink rounded-full px-2 py-px text-xs font-semibold text-white">{n.count}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="border-line mt-auto flex flex-col gap-1 border-t px-3 pt-4 pb-1">{footer}</div>
    </aside>
  );
}

/** Bottom tab bar on phones: Overview, Reservations, Rooms and More. */
export function TabBar({ tabs, moreHrefs }: { tabs: NavItem[]; moreHrefs: string[] }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Admin"
      className="border-line fixed inset-x-0 bottom-0 z-50 grid h-[68px] border-t bg-white md:hidden"
      style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}
    >
      {tabs.map((t) => {
        const on = t.href === "/admin/more" ? moreHrefs.some((h) => active(pathname, h)) : active(pathname, t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={on ? "page" : undefined}
            className={clsx(
              "text-ink relative flex flex-col items-center justify-center gap-1 text-[13px] no-underline",
              on ? "font-bold" : "font-medium",
            )}
          >
            <span className={clsx("h-1.5 w-11 rounded-full", on ? "bg-ink" : "bg-transparent")} />
            {t.label}
            {!!t.count && (
              <span className="bg-ink absolute top-2.5 right-[calc(50%-34px)] rounded-full px-1.5 text-[11px] font-semibold text-white">
                {t.count}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
