import clsx from "clsx";
import Link from "next/link";
import type { ReactNode } from "react";
import type { ReservationStatus } from "@/db/schema";
import { STATUS_LABEL, STATUS_TAG } from "@/lib/status";

export function PageHeader({
  title,
  sub,
  back,
  action,
}: {
  title: ReactNode;
  sub?: ReactNode;
  back?: { href: string; label: string };
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-1">
        {back && (
          <Link href={back.href} className="text-teal text-sm font-semibold no-underline">
            ← {back.label}
          </Link>
        )}
        <h1 className="m-0 text-[28px] font-bold tracking-[-0.01em]">{title}</h1>
        {sub && <span className="text-slate text-[15px]">{sub}</span>}
      </div>
      {action}
    </div>
  );
}

export function ActionLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="bg-ink hover:bg-teal inline-flex h-11 items-center rounded-full px-5 text-[15px] font-semibold text-white no-underline hover:text-white"
    >
      {children}
    </Link>
  );
}

/** Coloured status tag that always carries the word, so colour is never the only signal. */
export function StatusTag({ status, className }: { status: ReservationStatus; className?: string }) {
  const t = STATUS_TAG[status];
  return (
    <span
      className={clsx("inline-block rounded-full px-2.5 py-[3px] text-[13px] font-semibold whitespace-nowrap", className)}
      style={{ background: t.bg, color: t.fg }}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

export function Tag({ tone, children }: { tone: "green" | "aqua" | "grey" | "red"; children: ReactNode }) {
  const tones = {
    green: "bg-success-tint text-success",
    aqua: "bg-aqua text-ink",
    grey: "bg-[#ECEEEE] text-[#4A5757]",
    red: "bg-[#F8E1E1] text-error-deep",
  };
  return (
    <span className={clsx("inline-block rounded-full px-2.5 py-[3px] text-[13px] font-semibold whitespace-nowrap", tones[tone])}>{children}</span>
  );
}

/** Plain sentence-case empty state with one clear button. */
export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="rounded-card bg-aqua-tint flex flex-col items-start gap-3 p-8">
      <span className="text-lg font-bold">{title}</span>
      <span className="text-slate text-[15px] leading-normal">{body}</span>
      {action}
    </div>
  );
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx("rounded-card border-line overflow-hidden border", className)}>{children}</div>;
}

export function PanelHead({ children }: { children: ReactNode }) {
  return (
    <div className="border-line bg-aqua-tint flex items-center justify-between gap-3 border-b px-[18px] py-3.5 text-[15px] font-semibold">
      {children}
    </div>
  );
}

export const rowLink =
  "flex items-center gap-4 border-b border-line px-4 py-3.5 text-ink no-underline last:border-b-0 hover:bg-row-hover hover:text-ink";

export function Notice({ children, tone = "aqua" }: { children: ReactNode; tone?: "aqua" | "warn" | "error" }) {
  const tones = {
    aqua: "bg-aqua-tint",
    warn: "bg-sample text-sample-ink",
    error: "bg-error-tint text-error-deep",
  };
  return <div className={clsx("rounded-field px-4 py-3 text-[15px] leading-normal", tones[tone])}>{children}</div>;
}
