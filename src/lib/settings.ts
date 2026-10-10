import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { settings } from "@/db/schema";

export type SiteSettings = {
  hotelName: string;
  /** Main reception line, used where no branch is in context. */
  contactPhone: string;
  contactWhatsapp: string;
  contactEmail: string;
  /** Where new-request alerts are sent. */
  notificationEmail: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  x: string;
  /** When on, the site shows "call to book" instead of taking requests. */
  requestsPaused: boolean;
  /** Placeholder contact details still need replacing. */
  contactIsSample: boolean;
  /** Shown on the Book page, one rule per line. */
  houseRules: string;
  houseRulesIsSample: boolean;
};

export const DEFAULT_SETTINGS: SiteSettings = {
  hotelName: "De Classic Hotel",
  contactPhone: "08000000000",
  contactWhatsapp: "08000000000",
  contactEmail: "",
  notificationEmail: "",
  instagram: "",
  facebook: "",
  tiktok: "",
  x: "",
  requestsPaused: false,
  contactIsSample: true,
  houseRules: [
    "You pay at check in. Nothing is paid on this website.",
    "Please bring a valid photo ID.",
    "No smoking in the rooms.",
    "Visitors leave by 10pm unless they are staying the night.",
  ].join("\n"),
  houseRulesIsSample: true,
};

export async function getSettings(): Promise<SiteSettings> {
  const rows = await db.select().from(settings);
  const out: Record<string, unknown> = { ...DEFAULT_SETTINGS };
  for (const r of rows) if (r.key in DEFAULT_SETTINGS) out[r.key] = r.value;
  return out as SiteSettings;
}

export async function saveSettings(values: Partial<SiteSettings>) {
  const entries = Object.entries(values).filter(([k]) => k in DEFAULT_SETTINGS);
  if (!entries.length) return;
  await db
    .insert(settings)
    .values(entries.map(([key, value]) => ({ key, value, updatedAt: new Date() })))
    .onConflictDoUpdate({
      target: settings.key,
      set: { value: sql.raw("excluded.value"), updatedAt: new Date() },
    });
}
