"use server";

import { and, count, eq, gte, isNull, lte, or } from "drizzle-orm";
import { after } from "next/server";
import { db } from "@/db";
import { branches, offers, reservationEvents, reservations, roomTypes } from "@/db/schema";
import { newRequestEmail, sendMail } from "@/lib/email";
import { dateRange, dayDate, formatNaira, friendlyTime, nightsBetween, plural, todayInLagos } from "@/lib/format";
import { displayLocal } from "@/lib/phone";
import { isUniqueViolation } from "@/lib/db-errors";
import { makeReference } from "@/lib/reference";
import { hashedIp } from "@/lib/request-meta";
import { fieldErrors, reservationSchema, type ReservationInput } from "@/lib/reservation-schema";
import { getSettings } from "@/lib/settings";
import { whatsappText, type RequestSummary } from "@/lib/whatsapp-message";

export type SubmitResult =
  | { ok: true; summary: RequestSummary }
  | { ok: false; fieldErrors?: Record<string, string>; formError?: string; step?: 1 | 2 };

const PER_PHONE_PER_HOUR = 3;
const PER_IP_PER_HOUR = 8;

export async function submitReservation(input: ReservationInput): Promise<SubmitResult> {
  const settings = await getSettings();
  if (settings.requestsPaused) {
    return { ok: false, formError: "Online requests are paused right now. Please call or WhatsApp the front desk to book." };
  }

  const parsed = reservationSchema.safeParse(input);
  if (!parsed.success) {
    const errors = fieldErrors(parsed.error);
    const stepTwo = ["name", "phone", "email", "contactMethod", "requests"];
    return { ok: false, fieldErrors: errors, step: Object.keys(errors).every((k) => stepTwo.includes(k)) ? 2 : 1 };
  }
  const v = parsed.data;

  const branch = await db.query.branches.findFirst({ where: and(eq(branches.slug, v.branch), eq(branches.isPublished, true)) });
  if (!branch) return { ok: false, fieldErrors: { branch: "Pick a branch." }, step: 1 };

  const room = await db.query.roomTypes.findFirst({
    where: and(eq(roomTypes.branchId, branch.id), eq(roomTypes.slug, v.room), eq(roomTypes.isVisible, true)),
  });
  if (!room) return { ok: false, fieldErrors: { room: "That room isn't available to book online. Pick another." }, step: 1 };

  const shortStay = v.stayType === "short_stay";
  if (shortStay && (!branch.allowsShortStay || room.shortStayPrice == null)) {
    return { ok: false, fieldErrors: { stayType: "Short stays aren't offered for this room. Choose overnight." }, step: 1 };
  }
  if (v.guests > room.capacity * v.rooms) {
    return {
      ok: false,
      fieldErrors: { guests: `That's more than ${plural(v.rooms, "room")} can sleep. Add a room or pick a bigger one.` },
      step: 1,
    };
  }

  // An offer is only recorded if it is live today and belongs to this branch.
  let offer: { id: string; title: string } | null = null;
  if (v.offer) {
    const today = todayInLagos();
    const found = await db.query.offers.findFirst({
      where: and(
        eq(offers.id, v.offer),
        eq(offers.branchId, branch.id),
        eq(offers.isActive, true),
        lte(offers.startsOn, today),
        or(isNull(offers.endsOn), gte(offers.endsOn, today)),
      ),
      columns: { id: true, title: true },
    });
    offer = found ?? null;
  }

  // Honeypot: bots fill the hidden field. Pretend it worked and store nothing.
  if (input.website) {
    return { ok: true, summary: buildSummary({ reference: makeReference(), v, room, branchName: branch.name, whatsapp: branch.whatsapp, offerTitle: null }) };
  }

  const ipHash = await hashedIp();
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const [[byPhone], [byIp]] = await Promise.all([
    db.select({ n: count() }).from(reservations).where(and(eq(reservations.phone, v.phone), gte(reservations.createdAt, hourAgo))),
    ipHash
      ? db.select({ n: count() }).from(reservations).where(and(eq(reservations.ipHash, ipHash), gte(reservations.createdAt, hourAgo)))
      : Promise.resolve([{ n: 0 }]),
  ]);
  if (byPhone.n >= PER_PHONE_PER_HOUR || byIp.n >= PER_IP_PER_HOUR) {
    return {
      ok: false,
      formError: "We've already had a few requests from you in the last hour. The front desk will be in touch, or send us a WhatsApp.",
    };
  }

  const rate = shortStay ? room.shortStayPrice! : room.pricePerNight;
  let created: { id: string; reference: string } | null = null;
  for (let attempt = 0; attempt < 8 && !created; attempt++) {
    const reference = makeReference(attempt);
    try {
      created = await db.transaction(async (tx) => {
        const [row] = await tx
          .insert(reservations)
          .values({
            reference,
            branchId: branch.id,
            roomTypeId: room.id,
            roomName: room.name,
            quotedRate: rate,
            offerId: offer?.id ?? null,
            offerTitle: offer?.title ?? null,
            stayType: v.stayType,
            checkIn: v.checkIn,
            checkOut: shortStay ? null : v.checkOut,
            arrivalTime: shortStay ? v.arrivalTime : null,
            rooms: v.rooms,
            guests: v.guests,
            name: v.name,
            phone: v.phone,
            email: v.email || null,
            contactMethod: v.contactMethod,
            requests: v.requests || null,
            ipHash,
          })
          .returning({ id: reservations.id, reference: reservations.reference });
        await tx.insert(reservationEvents).values({ reservationId: row.id, toStatus: "new", note: "Request received from the website" });
        return row;
      });
    } catch (e) {
      // Unique clash on the reference: try another code. Anything else is a real failure.
      if (!isUniqueViolation(e)) {
        console.error("[book] insert failed", e);
        return { ok: false, formError: "Your request didn't send. Your details are still here. Try again, or send them to us on WhatsApp." };
      }
    }
  }
  if (!created) return { ok: false, formError: "Your request didn't send. Please try again in a moment." };

  const summary = buildSummary({ reference: created.reference, v, room, branchName: branch.name, whatsapp: branch.whatsapp, offerTitle: offer?.title ?? null });

  // Email the hotel after the response is sent, so the guest never waits on it.
  const reservationId = created.id;
  after(async () => {
    const rows: [string, string][] = [
      ["Guest", v.name],
      ["Phone", `${displayLocal(v.phone)} (prefers ${v.contactMethod === "whatsapp" ? "WhatsApp" : "a call"})`],
      ...(v.email ? ([["Email", v.email]] as [string, string][]) : []),
      ["Branch", branch.name],
      ["Room", `${room.name}${v.rooms > 1 ? ` × ${v.rooms}` : ""}`],
      [shortStay ? "Short stay" : "Dates", summary.datesText + (summary.nightsText ? `, ${summary.nightsText}` : "")],
      ["Guests", String(v.guests)],
      ["Estimated total", summary.totalText],
      ...(offer ? ([["Offer", offer.title]] as [string, string][]) : []),
    ];
    const result = await sendMail(
      newRequestEmail({
        to: [settings.notificationEmail, branch.email],
        reservationId,
        reference: summary.reference,
        rows,
        requests: v.requests || null,
      }),
    );
    await db.insert(reservationEvents).values({
      reservationId,
      note: result.sent ? "Email alert sent to the hotel" : `Email alert not sent (${result.error ?? "unknown error"})`,
    });
  });

  return { ok: true, summary };
}

function buildSummary(args: {
  reference: string;
  v: { name: string; phone: string; stayType: "overnight" | "short_stay"; checkIn: string; checkOut: string; arrivalTime: string; rooms: number; guests: number; contactMethod: "call" | "whatsapp" };
  room: { name: string; pricePerNight: number; shortStayPrice: number | null };
  branchName: string;
  whatsapp: string;
  offerTitle: string | null;
}): RequestSummary {
  const { v, room } = args;
  const shortStay = v.stayType === "short_stay";
  const rate = shortStay ? (room.shortStayPrice ?? 0) : room.pricePerNight;
  const nights = shortStay ? 0 : nightsBetween(v.checkIn, v.checkOut);
  const total = rate * v.rooms * (shortStay ? 1 : nights);
  const base = {
    reference: args.reference,
    name: v.name,
    phone: displayLocal(v.phone),
    branchName: args.branchName,
    roomName: room.name,
    rooms: v.rooms,
    guests: v.guests,
    stayType: v.stayType,
    datesText: shortStay ? `${dayDate(v.checkIn)}, arriving ${friendlyTime(v.arrivalTime)}` : dateRange(v.checkIn, v.checkOut),
    nightsText: shortStay ? "" : plural(nights, "night"),
    offerTitle: args.offerTitle,
    contactMethod: v.contactMethod,
  };
  return {
    ...base,
    rateText: `${formatNaira(rate)}${shortStay ? " short stay" : " / night"}`,
    totalText: formatNaira(total),
    hotelWhatsapp: args.whatsapp,
    whatsappMessage: whatsappText(base),
  };
}
