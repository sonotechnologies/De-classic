import clsx from "clsx";
import type { Metadata } from "next";
import Link from "next/link";
import { ReservationList } from "@/components/admin/reservation-list";
import { EmptyState, PageHeader } from "@/components/admin/ui";
import { branchesFor, listReservations, overbookingFor } from "@/lib/admin-data";
import { requireUser } from "@/lib/authz";
import { isIsoDate, plural, todayInLagos } from "@/lib/format";
import { STATUS_LABEL, STATUSES } from "@/lib/status";

export const metadata: Metadata = { title: "Reservations" };

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function ReservationsPage({ searchParams }: PageProps<"/admin/reservations">) {
  const user = await requireUser();
  const sp = await searchParams;
  const today = todayInLagos();
  const status = STATUSES.includes(one(sp.status) as never) ? one(sp.status) : "all";
  const when = one(sp.when);
  const from = when === "today" ? today : isIsoDate(one(sp.from)) ? one(sp.from) : "";
  const to = when === "today" ? today : isIsoDate(one(sp.to)) ? one(sp.to) : "";
  const q = one(sp.q).slice(0, 80);
  const branch = one(sp.branch);
  const page = Number(one(sp.page)) || 1;

  const [branches, result] = await Promise.all([branchesFor(user), listReservations(user, { status, branch, from, to, q, page })]);
  const warnings = await overbookingFor(result.rows);
  const multi = user.role === "owner" && branches.length > 1;

  const href = (patch: Record<string, string>) => {
    const p = new URLSearchParams();
    const merged = { status, branch, from, to, q, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v && !(k === "status" && v === "all")) p.set(k, v);
    const s = p.toString();
    return `/admin/reservations${s ? `?${s}` : ""}`;
  };
  const filtered = status !== "all" || !!from || !!to || !!q || !!branch;
  const pills = ["all", "new", "confirmed", "checked_in", "completed", "cancelled", "declined", "no_show"];

  return (
    <>
      <PageHeader
        title="Reservations"
        sub={`${plural(result.total, "request")}${filtered ? " match" : ""}${from && from === to ? ` · arriving ${from === today ? "today" : from}` : ""}`}
      />

      <form method="get" action="/admin/reservations" className="flex flex-wrap gap-2" role="search">
        {status !== "all" && <input type="hidden" name="status" value={status} />}
        <label className="sr-only" htmlFor="q">
          Search
        </label>
        <input
          id="q"
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search name, phone or reference"
          className="border-line focus:border-ink h-11 flex-[1_1_240px] rounded-full border-[1.5px] px-4 text-[15px] outline-none"
        />
        {multi && (
          <select
            name="branch"
            defaultValue={branch}
            aria-label="Branch"
            className="border-line h-11 rounded-full border-[1.5px] bg-white px-4 text-[15px]"
          >
            <option value="">All branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        )}
        <label className="border-line text-teal flex h-11 items-center gap-2 rounded-full border-[1.5px] px-4 text-[13px] font-semibold">
          from
          <input type="date" name="from" defaultValue={from} className="text-ink border-0 bg-transparent text-[15px] font-normal outline-none" />
        </label>
        <label className="border-line text-teal flex h-11 items-center gap-2 rounded-full border-[1.5px] px-4 text-[13px] font-semibold">
          to
          <input type="date" name="to" defaultValue={to} className="text-ink border-0 bg-transparent text-[15px] font-normal outline-none" />
        </label>
        <button type="submit" className="bg-ink hover:bg-teal h-11 rounded-full border-0 px-5 text-[15px] font-semibold text-white">
          Search
        </button>
      </form>

      <div className="no-scrollbar -mt-2 flex gap-2 overflow-x-auto pb-0.5">
        {pills.map((k) => (
          <Link
            key={k}
            href={href({ status: k, page: "" })}
            aria-current={status === k ? "true" : undefined}
            className={clsx(
              "text-ink hover:text-ink flex h-10 flex-none items-center rounded-full border-[1.5px] px-4 text-sm font-semibold no-underline",
              status === k ? "border-ink bg-aqua" : "border-line bg-white",
            )}
          >
            {k === "all" ? "All" : STATUS_LABEL[k as keyof typeof STATUS_LABEL]}
          </Link>
        ))}
      </div>

      {result.rows.length === 0 ? (
        <EmptyState
          title={
            status !== "all"
              ? `No ${STATUS_LABEL[status as keyof typeof STATUS_LABEL].toLowerCase()} reservations`
              : filtered
                ? "Nothing matches"
                : "No reservations yet"
          }
          body={filtered ? "Nothing matches this filter right now." : "Requests from the website appear here as soon as guests send them."}
          action={
            filtered ? (
              <Link
                href="/admin/reservations"
                className="border-ink text-ink inline-flex h-11 items-center rounded-full border-[1.5px] bg-white px-5 text-[15px] font-semibold no-underline"
              >
                Show all reservations
              </Link>
            ) : undefined
          }
        />
      ) : (
        <ReservationList rows={result.rows} showBranch={multi} warnings={new Set(warnings.keys())} />
      )}

      {result.pages > 1 && (
        <nav aria-label="Pages" className="flex items-center justify-between text-[15px]">
          {result.page > 1 ? (
            <Link href={href({ page: String(result.page - 1) })} className="font-semibold no-underline">
              ← Newer
            </Link>
          ) : (
            <span />
          )}
          <span className="text-slate">
            Page {result.page} of {result.pages}
          </span>
          {result.page < result.pages ? (
            <Link href={href({ page: String(result.page + 1) })} className="font-semibold no-underline">
              Older →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </>
  );
}
