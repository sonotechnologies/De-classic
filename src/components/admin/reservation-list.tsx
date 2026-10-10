import Link from "next/link";
import type { ReservationStatus } from "@/db/schema";
import { dateRange, todayInLagos } from "@/lib/format";
import { displayLocal } from "@/lib/phone";
import { StatusTag } from "./ui";

export type ResRow = {
  id: string;
  reference: string;
  name: string;
  phone: string;
  checkIn: string;
  checkOut: string | null;
  roomName: string;
  rooms: number;
  status: ReservationStatus;
  stayType: "overnight" | "short_stay";
  branch: { name: string };
};

function dates(r: ResRow) {
  const today = todayInLagos();
  const text = dateRange(r.checkIn, r.checkOut);
  const withToday = r.checkIn === today ? text.replace(/^\d+(\s\w+)?/, "Today") : text;
  return r.stayType === "short_stay" ? `${withToday} · short stay` : withToday;
}

/** Cards on phones, a table on desktop. Each row shows guest, dates, room, reference and a status tag. */
export function ReservationList({ rows, showBranch, warnings }: { rows: ResRow[]; showBranch: boolean; warnings?: Set<string> }) {
  const cols = showBranch ? "md:grid-cols-[1.4fr_1.2fr_1fr_0.9fr_0.9fr_110px]" : "md:grid-cols-[1.4fr_1.2fr_1fr_0.9fr_110px]";
  return (
    <>
      <div className="rounded-card border-line hidden overflow-hidden border md:block">
        <div className={`bg-aqua-tint grid gap-4 px-[18px] py-3 text-[13px] font-semibold ${cols}`}>
          <span>Guest</span>
          <span>Dates</span>
          <span>Room</span>
          {showBranch && <span>Branch</span>}
          <span>Reference</span>
          <span>Status</span>
        </div>
        {rows.map((r) => (
          <Link
            key={r.id}
            href={`/admin/reservations/${r.id}`}
            className={`border-line text-ink hover:bg-row-hover hover:text-ink grid items-center gap-4 border-t px-[18px] py-3.5 text-[15px] no-underline ${cols}`}
          >
            <span className="flex flex-col">
              <span className="font-semibold">{r.name}</span>
              <span className="text-slate text-[13px]">{displayLocal(r.phone)}</span>
            </span>
            <span>{dates(r)}</span>
            <span>
              {r.roomName.replace(/ room$/i, "")}
              {r.rooms > 1 ? ` × ${r.rooms}` : ""}
              {warnings?.has(r.id) && (
                <span
                  className="bg-sample text-sample-ink ml-1.5 rounded-[6px] px-1.5 py-px text-xs font-semibold"
                  title="More rooms requested than the hotel has"
                >
                  Over
                </span>
              )}
            </span>
            {showBranch && <span>{r.branch.name}</span>}
            <span className="text-slate">{r.reference}</span>
            <StatusTag status={r.status} className="justify-self-start" />
          </Link>
        ))}
      </div>
      <div className="flex flex-col gap-2.5 md:hidden">
        {rows.map((r) => (
          <Link
            key={r.id}
            href={`/admin/reservations/${r.id}`}
            className="rounded-card border-line text-ink flex flex-col gap-2 border p-4 no-underline"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-base font-semibold">{r.name}</span>
              <StatusTag status={r.status} />
            </div>
            <span className="text-[15px]">
              {dates(r)} · {r.roomName.replace(/ room$/i, "")}
              {r.rooms > 1 ? ` × ${r.rooms}` : ""}
            </span>
            <span className="text-slate text-[13px]">
              {r.reference}
              {showBranch ? ` · ${r.branch.name}` : ""}
              {warnings?.has(r.id) && <span className="bg-sample text-sample-ink ml-1.5 rounded-[6px] px-1.5 py-px text-xs font-semibold">Over</span>}
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}
