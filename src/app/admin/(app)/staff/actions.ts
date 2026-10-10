"use server";

import bcrypt from "bcryptjs";
import { and, count, eq, ne } from "drizzle-orm";
import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { branches, roleEnum, users } from "@/db/schema";
import { failure, formObject, zodErrors, type ActionState } from "@/lib/admin-actions";
import { AuthzError, OWNER_ONLY, requireActionUser } from "@/lib/authz";
import { sendMail, staffInviteEmail } from "@/lib/email";
import { normalizeNigerianPhone } from "@/lib/phone";
import { ROLE_LABEL } from "@/lib/status";

/** Easy to read out over the phone: no 0/O or 1/l. */
function tempPassword() {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  const pick = () => Array.from({ length: 4 }, () => chars[randomInt(chars.length)]).join("");
  return `${pick()}-${pick()}-${pick()}`;
}

const staffSchema = z
  .object({
    name: z.string().trim().min(2, "Add their name.").max(80),
    email: z.string().trim().toLowerCase().email("That email doesn't look right."),
    phone: z
      .string()
      .trim()
      .optional()
      .default("")
      .refine((s) => s === "" || !!normalizeNigerianPhone(s), "Use 11 digits, like 0803 123 4567."),
    role: z.enum(roleEnum.enumValues),
    branchId: z.string().optional().default(""),
  })
  .refine((v) => v.role === "owner" || /^[0-9a-f-]{36}$/i.test(v.branchId), {
    path: ["branchId"],
    message: "Pick their branch.",
  });

async function checkBranch(role: string, branchId: string) {
  if (role === "owner") return null;
  const b = await db.query.branches.findFirst({
    where: eq(branches.id, branchId),
    columns: { id: true },
  });
  if (!b) throw new AuthzError("That branch no longer exists.");
  return b.id;
}

export async function inviteStaff(_prev: ActionState, fd: FormData): Promise<ActionState> {
  try {
    await requireActionUser(OWNER_ONLY);
    const parsed = staffSchema.safeParse(formObject(fd));
    if (!parsed.success) return { ok: false, errors: zodErrors(parsed.error) };
    const v = parsed.data;
    const exists = await db.query.users.findFirst({
      where: eq(users.email, v.email),
      columns: { id: true },
    });
    if (exists)
      return {
        ok: false,
        errors: { email: "Someone already has an account with that email." },
      };
    const temp = tempPassword();
    await db.insert(users).values({
      name: v.name,
      email: v.email,
      phone: normalizeNigerianPhone(v.phone) ?? "",
      role: v.role,
      branchId: await checkBranch(v.role, v.branchId),
      passwordHash: await bcrypt.hash(temp, 12),
      mustChangePassword: true,
    });
    const mail = await sendMail(
      staffInviteEmail({
        to: v.email,
        name: v.name.split(" ")[0],
        tempPassword: temp,
        role: ROLE_LABEL[v.role],
      }),
    );
    revalidatePath("/admin/staff");
    return {
      ok: true,
      message: "Staff account created",
      data: {
        name: v.name,
        email: v.email,
        temp,
        emailed: mail.sent ? "yes" : "no",
      },
    };
  } catch (e) {
    return failure(e);
  }
}

async function loadOther(id: string) {
  const me = await requireActionUser(OWNER_ONLY);
  const user = await db.query.users.findFirst({
    where: eq(users.id, z.string().uuid().parse(id)),
  });
  if (!user) throw new AuthzError("That account no longer exists.");
  return { me, user };
}

async function otherActiveOwners(excludeId: string) {
  const [{ n }] = await db
    .select({ n: count() })
    .from(users)
    .where(and(eq(users.role, "owner"), eq(users.isActive, true), ne(users.id, excludeId)));
  return n;
}

export async function updateStaff(id: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const { user } = await loadOther(id);
    const parsed = staffSchema.safeParse(formObject(fd));
    if (!parsed.success) return { ok: false, errors: zodErrors(parsed.error) };
    const v = parsed.data;
    if (user.role === "owner" && v.role !== "owner" && (await otherActiveOwners(user.id)) === 0) {
      return {
        ok: false,
        formError: "There must always be at least one owner.",
      };
    }
    const clash = await db.query.users.findFirst({
      where: and(eq(users.email, v.email), ne(users.id, user.id)),
      columns: { id: true },
    });
    if (clash)
      return {
        ok: false,
        errors: { email: "Someone else already uses that email." },
      };
    await db
      .update(users)
      .set({
        name: v.name,
        email: v.email,
        phone: normalizeNigerianPhone(v.phone) ?? "",
        role: v.role,
        branchId: await checkBranch(v.role, v.branchId),
      })
      .where(eq(users.id, user.id));
    revalidatePath("/admin/staff");
    return { ok: true, message: "Saved" };
  } catch (e) {
    return failure(e);
  }
}

export async function setStaffActive(id: string, active: boolean): Promise<ActionState> {
  try {
    const { me, user } = await loadOther(id);
    if (!active && user.id === me.id) return { ok: false, formError: "You can't deactivate your own account." };
    if (!active && user.role === "owner" && (await otherActiveOwners(user.id)) === 0)
      return {
        ok: false,
        formError: "There must always be at least one owner.",
      };
    await db.update(users).set({ isActive: active }).where(eq(users.id, user.id));
    revalidatePath("/admin/staff");
    return {
      ok: true,
      message: active ? `${user.name} can sign in again` : `${user.name} can no longer sign in`,
    };
  } catch (e) {
    return failure(e);
  }
}

export async function resetStaffPassword(id: string): Promise<ActionState> {
  try {
    const { user } = await loadOther(id);
    const temp = tempPassword();
    await db
      .update(users)
      .set({
        passwordHash: await bcrypt.hash(temp, 12),
        mustChangePassword: true,
        failedLogins: 0,
        lockedUntil: null,
      })
      .where(eq(users.id, user.id));
    revalidatePath("/admin/staff");
    return {
      ok: true,
      message: "Password reset",
      data: { name: user.name, temp },
    };
  } catch (e) {
    return failure(e);
  }
}
