/** Money is stored in kobo (integer) and shown in naira. */
const nairaFmt = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 });

export function formatNaira(kobo: number): string {
  return "₦" + nairaFmt.format(Math.round(kobo / 100));
}

/** Sticker style: ₦35k, ₦7.5k, ₦750. */
export function shortNaira(kobo: number): string {
  const naira = Math.round(kobo / 100);
  if (naira >= 1000) {
    const k = naira / 1000;
    return "₦" + (Number.isInteger(k) ? k : Number(k.toFixed(1))) + "k";
  }
  return "₦" + naira;
}

/** Parses admin input such as "35,000" or "₦35000" into kobo. Returns null if it is not a whole naira amount. */
export function parseNairaToKobo(input: string): number | null {
  const cleaned = input.replace(/[₦,\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  return Math.round(Number(cleaned) * 100);
}

export function koboToNairaInput(kobo: number | null | undefined): string {
  return kobo == null ? "" : String(Math.round(kobo / 100));
}

const TZ = "Africa/Lagos";

/** Today's date in Lagos as YYYY-MM-DD. */
export function todayInLagos(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function addDays(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  return Math.round((Date.parse(checkOut + "T00:00:00Z") - Date.parse(checkIn + "T00:00:00Z")) / 864e5);
}

export function isIsoDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + "T00:00:00Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

/** "16 Oct" */
export function shortDate(iso: string): string {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

/** "Thu 16 Oct" */
export function dayDate(iso: string): string {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

/** "31 October" */
export function longDate(iso: string): string {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

/** "16 – 18 Oct" or "30 Oct – 2 Nov". */
export function dateRange(checkIn: string, checkOut: string | null): string {
  if (!checkOut) return shortDate(checkIn);
  const a = new Date(checkIn + "T00:00:00Z");
  const b = new Date(checkOut + "T00:00:00Z");
  if (a.getUTCMonth() === b.getUTCMonth() && a.getUTCFullYear() === b.getUTCFullYear()) {
    return `${a.getUTCDate()} – ${shortDate(checkOut)}`;
  }
  return `${shortDate(checkIn)} – ${shortDate(checkOut)}`;
}

/** "14:00" → "2pm", "12:00" → "12 noon", "18:30" → "6:30pm". */
export function friendlyTime(hhmm: string): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  if (!m) return hhmm;
  const h = Number(m[1]);
  const min = m[2];
  if (h === 12 && min === "00") return "12 noon";
  if (h === 0 && min === "00") return "midnight";
  const suffix = h >= 12 ? "pm" : "am";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return min === "00" ? `${h12}${suffix}` : `${h12}:${min}${suffix}`;
}

export function relativeTime(date: Date, now = new Date()): string {
  const s = Math.round((now.getTime() - date.getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} minute${m === 1 ? "" : "s"} ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const d = Math.round(h / 24);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}

/** "Today, 10:42" or "8 Oct, 10:42" in Lagos time. */
export function stamp(date: Date, now = new Date()): string {
  const time = date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  });
  const day =
    todayInLagos(date) === todayInLagos(now)
      ? "Today"
      : date.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          timeZone: TZ,
        });
  return `${day}, ${time}`;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function plural(n: number, one: string, many = one + "s"): string {
  return `${n} ${n === 1 ? one : many}`;
}
