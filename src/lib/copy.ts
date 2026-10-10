import type { Branch } from "@/db/schema";

const WORDS = ["twelve", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];

/** First opening time in the bar hours, e.g. "6pm – 1am" → { time: "6pm", word: "six" }. */
export function barOpening(branch: Pick<Branch, "barHours">): { time: string; word: string } | null {
  const first = branch.barHours[0]?.time;
  if (!first) return null;
  const start = first.split(/[–-]/)[0].trim();
  const m = /^(\d{1,2})(?::\d{2})?\s*(am|pm)?$/i.exec(start);
  if (!m) return { time: start, word: start };
  const h = Number(m[1]);
  return {
    time: start,
    word: h <= 12 && start.indexOf(":") === -1 ? WORDS[h] : start,
  };
}

/** "5 min drive from Agric junction" from the first landmark. */
export function nearestLandmark(branch: Pick<Branch, "landmarks">): string | null {
  const lm = branch.landmarks[0];
  return lm ? `${lm.time} from ${lm.place}` : null;
}

/** "12 example street, agric" for big lowercase address headlines. */
export function shortAddress(branch: Pick<Branch, "address" | "area">): string {
  const street = branch.address.split(",")[0]?.trim() ?? branch.address;
  const area = branch.area.split(",")[0]?.trim();
  return (area ? `${street}, ${area}` : street).toLowerCase();
}

/** Two-line address headline for the Locations page: ["12 example street,", "agric, ikorodu"]. */
export function addressLines(branch: Pick<Branch, "address" | "area" | "name">): [string, string] {
  const street = (branch.address.split(",")[0]?.trim() ?? branch.address).toLowerCase();
  return [`${street},`, (branch.area || branch.name).toLowerCase()];
}

export function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** White tag on an offer block: the custom badge, or "ends 31 october". */
export function offerTag(offer: { badge: string; endsOn: string | null }): string {
  if (offer.badge) return offer.badge;
  if (!offer.endsOn) return "while it lasts";
  const d = new Date(offer.endsOn + "T00:00:00Z");
  return (
    "ends " +
    d
      .toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        timeZone: "UTC",
      })
      .toLowerCase()
  );
}
