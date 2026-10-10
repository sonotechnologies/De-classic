import "server-only";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AuthzError } from "./authz";
import { isUniqueViolation } from "./db-errors";
import { parseNairaToKobo } from "./format";

export type ActionState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string>;
  formError?: string;
  /** Extra values for the form to show, e.g. a temporary password shown once. */
  data?: Record<string, string>;
  /**
   * Where the form should go next. Create actions return this instead of calling redirect(), because a
   * redirect from a server action drops the revalidation of the public pages in Next 16.
   */
  redirectTo?: string;
};

/** Public pages are static; any admin save refreshes all of them so changes go live without a redeploy. */
export function revalidateSite() {
  revalidatePath("/", "layout");
}

export function zodErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/** Turns thrown errors into a plain message for staff; real bugs are logged. */
export function failure(e: unknown, fallback = "Couldn't save. Try again."): ActionState {
  if (e instanceof AuthzError) return { ok: false, formError: e.message };
  if (isUniqueViolation(e))
    return {
      ok: false,
      formError: "That name or web address is already used. Pick another.",
    };
  // Let Next.js redirects and notFound() propagate.
  if (e && typeof e === "object" && "digest" in e && typeof (e as { digest: unknown }).digest === "string") throw e;
  console.error("[admin action]", e);
  return { ok: false, formError: fallback };
}

/** FormData → plain object, with checkboxes as booleans and repeated keys as arrays. */
export function formObject(fd: FormData, arrays: string[] = []): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of new Set(fd.keys())) {
    if (key.startsWith("$ACTION")) continue;
    out[key] = arrays.includes(key) ? fd.getAll(key).map(String) : String(fd.get(key) ?? "");
  }
  for (const a of arrays) if (!(a in out)) out[a] = [];
  return out;
}

export const checkbox = z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean());

/** Admin price input in naira ("35,000") → kobo. */
export const nairaField = (label: string) =>
  z
    .string()
    .trim()
    .transform((s, ctx) => {
      const k = parseNairaToKobo(s);
      if (k == null || k <= 0) {
        ctx.addIssue({
          code: "custom",
          message: `Use numbers only for the ${label}, like 35000.`,
        });
        return z.NEVER;
      }
      return k;
    });

export const optionalNairaField = (label: string) => z.union([z.literal("").transform(() => null), nairaField(label)]);
