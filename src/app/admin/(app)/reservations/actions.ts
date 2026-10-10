"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { reservationEvents, reservations, reservationStatusEnum } from "@/db/schema";
import { failure, type ActionState } from "@/lib/admin-actions";
import { assertBranch, AuthzError, requireActionUser } from "@/lib/authz";
import { STATUS_LABEL } from "@/lib/status";

const idSchema = z.string().uuid();

async function loadFor(id: string) {
  const user = await requireActionUser();
  const res = await db.query.reservations.findFirst({
    where: eq(reservations.id, idSchema.parse(id)),
  });
  if (!res) throw new AuthzError("That reservation no longer exists.");
  assertBranch(user, res.branchId);
  return { user, res };
}

/** Every status change is logged with who made it and when. */
export async function changeStatus(id: string, to: string): Promise<ActionState> {
  try {
    const status = z.enum(reservationStatusEnum.enumValues).parse(to);
    const { user, res } = await loadFor(id);
    if (res.status === status) return { ok: true };
    await db.transaction(async (tx) => {
      await tx.update(reservations).set({ status }).where(eq(reservations.id, res.id));
      await tx.insert(reservationEvents).values({
        reservationId: res.id,
        userId: user.id,
        userName: user.name,
        fromStatus: res.status,
        toStatus: status,
      });
    });
    revalidatePath("/admin", "layout");
    return { ok: true, message: `Status changed to ${STATUS_LABEL[status]}` };
  } catch (e) {
    return failure(e, "Couldn't change the status. Try again.");
  }
}

export async function addNote(id: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const note = z
      .string()
      .trim()
      .min(1, "Write a note first.")
      .max(1000, "Keep notes under 1,000 characters.")
      .safeParse(String(fd.get("note") ?? ""));
    if (!note.success) return { ok: false, errors: { note: note.error.issues[0].message } };
    const { user, res } = await loadFor(id);
    await db.insert(reservationEvents).values({
      reservationId: res.id,
      userId: user.id,
      userName: user.name,
      note: note.data,
    });
    revalidatePath(`/admin/reservations/${res.id}`);
    return { ok: true, message: "Note saved" };
  } catch (e) {
    return failure(e, "Couldn't save the note. Try again.");
  }
}
