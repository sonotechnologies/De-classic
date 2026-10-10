import { desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ActionForm, SubmitButton, TextArea } from "@/components/admin/form";
import { Notice, PageHeader } from "@/components/admin/ui";
import { db } from "@/db";
import { reservationEvents, reservations } from "@/db/schema";
import { overbookingFor } from "@/lib/admin-data";
import { canAccessBranch, requireUser } from "@/lib/authz";
import { dayDate, formatNaira, friendlyTime, nightsBetween, plural, relativeTime, shortDate, stamp } from "@/lib/format";
import { displayLocal, telHref, whatsappHref } from "@/lib/phone";
import { STATUS_LABEL } from "@/lib/status";
import { addNote } from "../actions";
import { StatusPicker } from "./status-picker";

export const metadata: Metadata = { title: "Reservation" };

export default async function ReservationPage({ params }: PageProps<"/admin/reservations/[id]">) {
  const user = await requireUser();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const res = await db.query.reservations.findFirst({
    where: eq(reservations.id, id),
    with: {
      branch: true,
      events: { orderBy: [desc(reservationEvents.createdAt)] },
    },
  });
  // Staff from another branch get a plain 404, not a hint that the record exists.
  if (!res || !canAccessBranch(user, res.branchId)) notFound();

  const warnings = await overbookingFor([res]);
  const warning = warnings.get(res.id);
  const short = res.stayType === "short_stay";
  const nights = !short && res.checkOut ? nightsBetween(res.checkIn, res.checkOut) : 0;
  const total = res.quotedRate * res.rooms * (short ? 1 : nights);
  const first = res.name.split(" ")[0];
  const waText = `Hi ${first}, this is De Classic Hotel about your reservation request ${res.reference} (${res.roomName}, ${shortDate(res.checkIn)}${res.checkOut ? ` – ${shortDate(res.checkOut)}` : ""}).`;

  const details: [string, string][] = [
    ["Phone", `${displayLocal(res.phone)} (prefers ${res.contactMethod === "whatsapp" ? "WhatsApp" : "a call"})`],
    ...(res.email ? ([["Email", res.email]] as [string, string][]) : []),
    ["Room", `${res.roomName}${res.rooms > 1 ? ` × ${res.rooms}` : ""}`],
    ["Branch", res.branch.name],
    ...((short
      ? [
          ["Short stay", dayDate(res.checkIn)],
          ["Arriving", res.arrivalTime ? friendlyTime(res.arrivalTime) : "Not given"],
        ]
      : [
          ["Check in", `${dayDate(res.checkIn)}, from ${friendlyTime(res.branch.checkInTime)}`],
          ["Check out", `${res.checkOut ? dayDate(res.checkOut) : ""}, by ${friendlyTime(res.branch.checkOutTime)}`],
          ["Nights", String(nights)],
        ]) as [string, string][]),
    ["Guests", plural(res.guests, "adult")],
    ["Estimated total", `${formatNaira(total)} (${formatNaira(res.quotedRate)}${short ? " short stay" : " a night"})`],
    ...(res.offerTitle ? ([["Offer", res.offerTitle]] as [string, string][]) : []),
    ...(res.requests ? ([["Guest note", res.requests]] as [string, string][]) : []),
  ];

  return (
    <>
      <PageHeader
        back={{ href: "/admin/reservations", label: "Reservations" }}
        title={res.name}
        sub={`${res.reference} · requested ${relativeTime(res.createdAt)}`}
      />

      <div className="grid max-w-[520px] grid-cols-2 gap-2.5">
        <a
          href={telHref(res.phone)}
          className="bg-ink hover:bg-teal flex h-14 items-center justify-center rounded-full text-base font-semibold text-white no-underline hover:text-white"
        >
          Call guest
        </a>
        <a
          href={whatsappHref(res.phone, waText)}
          target="_blank"
          rel="noopener"
          className="border-ink text-ink hover:bg-ink flex h-14 items-center justify-center rounded-full border-[1.5px] text-base font-semibold no-underline hover:text-white"
        >
          WhatsApp
        </a>
      </div>

      {warning && (
        <Notice tone="warn">
          <strong>Possible over-booking.</strong> Requests for the {res.roomName.toLowerCase()} on {dayDate(warning.night)} add up to{" "}
          {plural(warning.requested, "room")}, but the branch has {warning.units}. Check before you confirm.
        </Notice>
      )}

      <div className="flex flex-wrap gap-6">
        <div className="flex flex-[1.3_1_320px] flex-col gap-5">
          <StatusPicker id={res.id} status={res.status} />
          <dl className="rounded-card border-line m-0 grid grid-cols-[auto_1fr] gap-x-6 border px-[18px] py-1.5 text-[15px]">
            {details.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="border-line-soft text-slate border-b py-[11px] last:border-b-0">{k}</dt>
                <dd className="border-line-soft m-0 border-b py-[11px] font-semibold whitespace-pre-line">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="flex flex-[1_1_280px] flex-col gap-5">
          <ActionForm action={addNote.bind(null, res.id)} resetOnSuccess className="flex flex-col gap-3">
            <TextArea name="note" label="Staff notes" rows={4} placeholder="Visible to staff only" maxLength={1000} />
            <SubmitButton className="h-11 self-start px-5 text-[15px]">Save note</SubmitButton>
          </ActionForm>
          <div className="flex flex-col">
            <span className="mb-2 text-sm font-semibold">History</span>
            {res.events.map((e) => (
              <div key={e.id} className="border-line flex flex-col gap-0.5 border-l-2 py-2.5 pl-4">
                <span className="text-[15px] whitespace-pre-line">
                  {e.toStatus && e.fromStatus
                    ? `Status changed from ${STATUS_LABEL[e.fromStatus]} to ${STATUS_LABEL[e.toStatus]}`
                    : e.toStatus && !e.note
                      ? `Status set to ${STATUS_LABEL[e.toStatus]}`
                      : e.note}
                </span>
                <span className="text-slate text-[13px]">
                  {stamp(e.createdAt)}
                  {e.userName ? ` · ${e.userName}` : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
