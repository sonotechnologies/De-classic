import { addDays } from "./format";

export type Stay = {
  id: string;
  roomTypeId: string | null;
  checkIn: string;
  checkOut: string | null;
  rooms: number;
};

/** Nights a stay occupies. A short stay holds the room on its date. */
function nights(s: Stay): string[] {
  const end = s.checkOut ?? addDays(s.checkIn, 1);
  const out: string[] = [];
  for (let d = s.checkIn; d < end && out.length < 62; d = addDays(d, 1)) out.push(d);
  return out;
}

/**
 * For each target stay, the busiest night it covers if requests for its room type on that night
 * add up to more rooms than the hotel has. Only a warning: requests are never blocked.
 */
export function findOverbooked(
  targets: Stay[],
  holding: Stay[],
  units: Map<string, number>,
): Map<string, { night: string; requested: number; units: number }> {
  const load = new Map<string, number>(); // `${roomTypeId}|${night}` → rooms requested
  for (const s of holding) {
    if (!s.roomTypeId) continue;
    for (const n of nights(s)) load.set(`${s.roomTypeId}|${n}`, (load.get(`${s.roomTypeId}|${n}`) ?? 0) + s.rooms);
  }
  const out = new Map<string, { night: string; requested: number; units: number }>();
  for (const t of targets) {
    if (!t.roomTypeId) continue;
    const cap = units.get(t.roomTypeId);
    if (cap == null) continue;
    let worst: { night: string; requested: number } | null = null;
    for (const n of nights(t)) {
      const requested = load.get(`${t.roomTypeId}|${n}`) ?? 0;
      if (requested > cap && (!worst || requested > worst.requested)) worst = { night: n, requested };
    }
    if (worst) out.set(t.id, { ...worst, units: cap });
  }
  return out;
}
