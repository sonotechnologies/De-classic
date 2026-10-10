"use server";

import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { offerRoomTypes, offers, roomTypes } from "@/db/schema";
import { checkbox, failure, formObject, revalidateSite, zodErrors, type ActionState } from "@/lib/admin-actions";
import { assertBranch, AuthzError, CONTENT_ROLES, requireActionUser } from "@/lib/authz";
import { isIsoDate } from "@/lib/format";

const offerSchema = z
  .object({
    branchId: z.string().uuid("Pick a branch."),
    title: z.string().trim().min(3, "Give the offer a short title.").max(70),
    description: z.string().trim().min(1, "Say what the guest gets.").max(400),
    terms: z.string().trim().max(400).optional().default(""),
    badge: z.string().trim().max(30).optional().default(""),
    ctaLabel: z.string().trim().max(30).optional().default(""),
    startsOn: z.string().refine(isIsoDate, "Pick a start date."),
    endsOn: z
      .string()
      .optional()
      .default("")
      .refine((s) => s === "" || isIsoDate(s), "Pick an end date, or leave it empty."),
    rooms: z.array(z.string().uuid()).default([]),
    isActive: checkbox,
    isSample: checkbox,
  })
  .refine((v) => !v.endsOn || v.endsOn >= v.startsOn, {
    path: ["endsOn"],
    message: "The end date needs to be on or after the start date.",
  });

export async function saveOffer(id: string | null, _prev: ActionState, fd: FormData): Promise<ActionState> {
  let createdId: string | null = null;
  try {
    const user = await requireActionUser(CONTENT_ROLES);
    const raw = formObject(fd, ["rooms"]);
    if (user.role !== "owner") raw.branchId = user.branchId;
    const parsed = offerSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, errors: zodErrors(parsed.error) };
    const v = parsed.data;
    assertBranch(user, v.branchId);
    if (id) {
      const existing = await db.query.offers.findFirst({
        where: eq(offers.id, id),
        columns: { branchId: true },
      });
      if (!existing) throw new AuthzError("That offer no longer exists.");
      assertBranch(user, existing.branchId);
    }
    // Only rooms from the offer's own branch can be linked.
    const rooms = v.rooms.length
      ? (
          await db
            .select({ id: roomTypes.id })
            .from(roomTypes)
            .where(and(inArray(roomTypes.id, v.rooms), eq(roomTypes.branchId, v.branchId)))
        ).map((r) => r.id)
      : [];
    const values = {
      branchId: v.branchId,
      title: v.title.toLowerCase(),
      description: v.description,
      terms: v.terms,
      badge: v.badge.toLowerCase(),
      ctaLabel: v.ctaLabel,
      startsOn: v.startsOn,
      endsOn: v.endsOn || null,
      isActive: v.isActive,
      isSample: v.isSample,
    };
    await db.transaction(async (tx) => {
      let offerId = id;
      if (offerId) await tx.update(offers).set(values).where(eq(offers.id, offerId));
      else {
        const [row] = await tx.insert(offers).values(values).returning({ id: offers.id });
        offerId = createdId = row.id;
      }
      await tx.delete(offerRoomTypes).where(eq(offerRoomTypes.offerId, offerId));
      if (rooms.length) await tx.insert(offerRoomTypes).values(rooms.map((roomTypeId) => ({ offerId: offerId!, roomTypeId })));
    });
    revalidateSite();
  } catch (e) {
    return failure(e);
  }
  if (createdId) return { ok: true, message: "Offer added", redirectTo: "/admin/offers" };
  return { ok: true, message: "Saved" };
}

export async function deleteOffer(id: string): Promise<ActionState> {
  try {
    const user = await requireActionUser(CONTENT_ROLES);
    const offer = await db.query.offers.findFirst({
      where: eq(offers.id, z.string().uuid().parse(id)),
    });
    if (!offer) throw new AuthzError("That offer no longer exists.");
    assertBranch(user, offer.branchId);
    await db.delete(offers).where(eq(offers.id, offer.id));
    revalidateSite();
    return { ok: true, message: "Offer deleted" };
  } catch (e) {
    return failure(e, "Couldn't delete the offer.");
  }
}
