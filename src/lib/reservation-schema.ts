import { z } from "zod";
import { isIsoDate, nightsBetween, todayInLagos } from "./format";
import { normalizeNigerianPhone } from "./phone";

/** Longest overnight stay a guest can request online. Longer stays go through the front desk. */
export const MAX_NIGHTS = 30;
export const MAX_ROOMS = 5;
export const MAX_GUESTS = 12;

/** Plain-words messages shown beside the field. */
export const MSG = {
  checkInPast: "Check in can't be in the past.",
  checkInMissing: "Pick a check-in date.",
  checkOutOrder: "Check out needs to be after check in.",
  tooLong: `For stays over ${MAX_NIGHTS} nights, call the front desk.`,
  arrival: "Pick roughly when you'll arrive.",
  room: "Pick a room.",
  name: "Please add your name.",
  phone: "That number looks short. Use 11 digits, like 080 0000 0000.",
  email: "That email doesn't look right. Leave it empty if you'd rather not.",
} as const;

export const stepOneSchema = z
  .object({
    branch: z.string().trim().min(1).max(60),
    stayType: z.enum(["overnight", "short_stay"]),
    checkIn: z.string().trim(),
    checkOut: z.string().trim().optional().default(""),
    arrivalTime: z.string().trim().optional().default(""),
    room: z.string().trim().min(1, MSG.room).max(60),
    rooms: z.coerce.number().int().min(1).max(MAX_ROOMS),
    guests: z.coerce.number().int().min(1).max(MAX_GUESTS),
    offer: z.string().uuid().optional().or(z.literal("")).default(""),
  })
  .superRefine((v, ctx) => {
    const today = todayInLagos();
    if (!isIsoDate(v.checkIn)) {
      ctx.addIssue({
        code: "custom",
        path: ["checkIn"],
        message: MSG.checkInMissing,
      });
      return;
    }
    if (v.checkIn < today)
      ctx.addIssue({
        code: "custom",
        path: ["checkIn"],
        message: MSG.checkInPast,
      });
    if (v.stayType === "overnight") {
      if (!isIsoDate(v.checkOut) || v.checkOut <= v.checkIn) {
        ctx.addIssue({
          code: "custom",
          path: ["checkOut"],
          message: MSG.checkOutOrder,
        });
      } else if (nightsBetween(v.checkIn, v.checkOut) > MAX_NIGHTS) {
        ctx.addIssue({
          code: "custom",
          path: ["checkOut"],
          message: MSG.tooLong,
        });
      }
    } else if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(v.arrivalTime)) {
      ctx.addIssue({
        code: "custom",
        path: ["arrivalTime"],
        message: MSG.arrival,
      });
    }
  });

export const stepTwoSchema = z.object({
  name: z.string().trim().min(2, MSG.name).max(80, "That name is too long."),
  phone: z
    .string()
    .trim()
    .transform((s, ctx) => {
      const n = normalizeNigerianPhone(s);
      if (!n) {
        ctx.addIssue({ code: "custom", message: MSG.phone });
        return z.NEVER;
      }
      return n;
    }),
  email: z
    .string()
    .trim()
    .max(120)
    .optional()
    .default("")
    .refine((s) => s === "" || z.string().email().safeParse(s).success, MSG.email),
  contactMethod: z.enum(["call", "whatsapp"]),
  requests: z.string().trim().max(500, "Keep it under 500 characters.").optional().default(""),
});

export const reservationSchema = z.intersection(stepOneSchema, stepTwoSchema);

export type ReservationInput = z.input<typeof stepOneSchema> & z.input<typeof stepTwoSchema> & { website?: string };

/** Flattens Zod issues into { field: first message }. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
