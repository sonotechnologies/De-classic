"use server";

import { count, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { branches, reservations } from "@/db/schema";
import { checkbox, failure, formObject, revalidateSite, zodErrors, type ActionState } from "@/lib/admin-actions";
import { AuthzError, OWNER_ONLY, requireActionUser } from "@/lib/authz";
import { slugify } from "@/lib/format";
import { normalizeNigerianPhone } from "@/lib/phone";

const phone = (label: string) =>
  z
    .string()
    .trim()
    .transform((s, ctx) => {
      const n = normalizeNigerianPhone(s);
      if (!n) {
        ctx.addIssue({
          code: "custom",
          message: `The ${label} needs 11 digits, like 0803 123 4567.`,
        });
        return z.NEVER;
      }
      return n;
    });

const url = z
  .string()
  .trim()
  .max(1000)
  .refine(
    (s) => s === "" || /^https:\/\/(www\.)?(google\.[a-z.]+|maps\.app\.goo\.gl|goo\.gl)\//i.test(s),
    "Paste a Google Maps link, starting with https://",
  );

/** "Mon to Thu | 6pm – 1am" lines → [{ days, time }]. */
function pairs(text: string, keys: [string, string]) {
  return text
    .split("\n")
    .map((l) => l.split("|").map((p) => p.trim()))
    .filter((p) => p[0])
    .slice(0, 12)
    .map((p) => ({
      [keys[0]]: p[0].slice(0, 80),
      [keys[1]]: (p[1] ?? "").slice(0, 40),
    }));
}

const branchSchema = z.object({
  name: z.string().trim().min(2, "Give the branch a name.").max(40),
  slug: z.string().trim().max(40).optional().default(""),
  area: z.string().trim().max(60).optional().default(""),
  address: z.string().trim().min(5, "Add the street address.").max(200),
  mapUrl: url,
  mapEmbedUrl: url,
  phone: phone("phone number"),
  whatsapp: phone("WhatsApp number"),
  email: z
    .string()
    .trim()
    .max(120)
    .refine((s) => s === "" || z.string().email().safeParse(s).success, "That email doesn't look right."),
  hours: z.string().trim().max(200).optional().default(""),
  barHours: z.string().max(1000).optional().default(""),
  barIntro: z.string().trim().max(400).optional().default(""),
  landmarks: z.string().max(1500).optional().default(""),
  checkInTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Pick a time."),
  checkOutTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Pick a time."),
  sortOrder: z.coerce.number().int().min(0).max(99).default(0),
  allowsShortStay: checkbox,
  isPublished: checkbox,
  isSample: checkbox,
});

export async function saveBranch(id: string | null, _prev: ActionState, fd: FormData): Promise<ActionState> {
  let created = false;
  try {
    await requireActionUser(OWNER_ONLY);
    const parsed = branchSchema.safeParse(formObject(fd));
    if (!parsed.success) return { ok: false, errors: zodErrors(parsed.error) };
    const v = parsed.data;
    const slug = slugify(v.slug || v.name);
    if (!slug || slug === "_")
      return {
        ok: false,
        errors: { slug: "Use letters or numbers in the web address." },
      };
    const values = {
      ...v,
      slug,
      area: v.area.toLowerCase(),
      barHours: pairs(v.barHours, ["days", "time"]) as {
        days: string;
        time: string;
      }[],
      landmarks: pairs(v.landmarks, ["place", "time"]) as {
        place: string;
        time: string;
      }[],
    };
    if (id) {
      const res = await db
        .update(branches)
        .set(values)
        .where(eq(branches.id, z.string().uuid().parse(id)))
        .returning({ id: branches.id });
      if (!res.length) throw new AuthzError("That branch no longer exists.");
    } else {
      await db.insert(branches).values(values);
      created = true;
    }
    revalidateSite();
  } catch (e) {
    return failure(e);
  }
  if (created) return { ok: true, message: "Branch added", redirectTo: "/admin/branches" };
  return { ok: true, message: "Saved" };
}

/** Branches with reservations can't be deleted, only unpublished, so the booking history stays intact. */
export async function deleteBranch(id: string): Promise<ActionState> {
  try {
    await requireActionUser(OWNER_ONLY);
    const branchId = z.string().uuid().parse(id);
    const [{ n }] = await db.select({ n: count() }).from(reservations).where(eq(reservations.branchId, branchId));
    if (n > 0)
      return {
        ok: false,
        formError: `This branch has ${n} reservation${n === 1 ? "" : "s"}. Unpublish it instead, so the history is kept.`,
      };
    await db.delete(branches).where(eq(branches.id, branchId));
    revalidateSite();
    return { ok: true, message: "Branch deleted" };
  } catch (e) {
    return failure(e, "Couldn't delete the branch.");
  }
}
