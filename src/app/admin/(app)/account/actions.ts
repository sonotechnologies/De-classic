"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { failure, zodErrors, type ActionState } from "@/lib/admin-actions";
import { requireActionUser } from "@/lib/authz";

const schema = z
  .object({
    current: z.string().min(1, "Enter your current password."),
    next: z.string().min(10, "Use at least 10 characters.").max(200),
    confirm: z.string(),
  })
  .refine((v) => v.next === v.confirm, {
    path: ["confirm"],
    message: "The two new passwords don't match.",
  })
  .refine((v) => v.next !== v.current, {
    path: ["next"],
    message: "Pick a password you haven't used here.",
  });

export async function changePassword(_prev: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const me = await requireActionUser();
    const parsed = schema.safeParse({
      current: fd.get("current"),
      next: fd.get("next"),
      confirm: fd.get("confirm"),
    });
    if (!parsed.success) return { ok: false, errors: zodErrors(parsed.error) };
    const row = await db.query.users.findFirst({
      where: eq(users.id, me.id),
      columns: { passwordHash: true },
    });
    if (!row || !(await bcrypt.compare(parsed.data.current, row.passwordHash)))
      return {
        ok: false,
        errors: { current: "That isn't your current password." },
      };
    await db
      .update(users)
      .set({
        passwordHash: await bcrypt.hash(parsed.data.next, 12),
        mustChangePassword: false,
      })
      .where(eq(users.id, me.id));
    revalidatePath("/admin", "layout");
    return { ok: true, message: "Password changed" };
  } catch (e) {
    return failure(e);
  }
}
