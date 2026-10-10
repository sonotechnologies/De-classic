"use server";

import { z } from "zod";
import { checkbox, failure, formObject, revalidateSite, zodErrors, type ActionState } from "@/lib/admin-actions";
import { OWNER_ONLY, requireActionUser } from "@/lib/authz";
import { normalizeNigerianPhone } from "@/lib/phone";
import { saveSettings } from "@/lib/settings";

const optionalEmail = z
  .string()
  .trim()
  .max(120)
  .refine((s) => s === "" || z.string().email().safeParse(s).success, "That email doesn't look right.");
const optionalUrl = z
  .string()
  .trim()
  .max(300)
  .refine((s) => s === "" || /^https:\/\/\S+$/.test(s), "Paste the full link, starting with https://");
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

const schema = z.object({
  hotelName: z.string().trim().min(2, "Add the hotel name.").max(60),
  contactPhone: phone("phone number"),
  contactWhatsapp: phone("WhatsApp number"),
  contactEmail: optionalEmail,
  notificationEmail: z.string().trim().toLowerCase().email("New requests need an email to go to."),
  instagram: optionalUrl,
  facebook: optionalUrl,
  tiktok: optionalUrl,
  x: optionalUrl,
  houseRules: z
    .string()
    .max(2000)
    .transform((s) =>
      s
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .join("\n"),
    ),
  requestsPaused: checkbox,
  contactIsSample: checkbox,
  houseRulesIsSample: checkbox,
});

export async function updateSettings(_prev: ActionState, fd: FormData): Promise<ActionState> {
  try {
    await requireActionUser(OWNER_ONLY);
    const parsed = schema.safeParse(formObject(fd));
    if (!parsed.success) return { ok: false, errors: zodErrors(parsed.error) };
    await saveSettings(parsed.data);
    revalidateSite();
    return { ok: true, message: "Settings saved" };
  } catch (e) {
    return failure(e);
  }
}
