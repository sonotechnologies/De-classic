import "server-only";
import { and, asc, count, desc, eq, gte, ilike, inArray, isNull, lte, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { branches, galleryImages, menuCategories, menuItems, offers, reservations, roomTypes, type ReservationStatus } from "@/db/schema";
import { branchScope, type StaffUser } from "./authz";
import { addDays, todayInLagos } from "./format";
import { findOverbooked } from "./overbooking";
import { getSettings } from "./settings";
import { HOLDING_STATUSES } from "./status";

export async function branchesFor(user: StaffUser) {
  const scope = branchScope(user);
  return db
    .select()
    .from(branches)
    .where(scope ? eq(branches.id, scope) : undefined)
    .orderBy(asc(branches.sortOrder), asc(branches.name));
}

/** Picks the branch an admin screen is working on: the staff member's own, or the owner's choice (default first). */
export async function pickBranch(user: StaffUser, requested: string | undefined) {
  const list = await branchesFor(user);
  const current = list.find((b) => b.id === requested) ?? list[0] ?? null;
  return { list, current };
}

function scopeRes(user: StaffUser): SQL | undefined {
  const s = branchScope(user);
  return s ? eq(reservations.branchId, s) : undefined;
}

export async function overviewStats(user: StaffUser) {
  const today = todayInLagos();
  const weekAgo = new Date(Date.now() - 7 * 864e5);
  const scope = scopeRes(user);
  const [[newReq], [arrivals], [week], latest, perBranch] = await Promise.all([
    db
      .select({ n: count() })
      .from(reservations)
      .where(and(scope, eq(reservations.status, "new"))),
    db
      .select({ n: count() })
      .from(reservations)
      .where(and(scope, eq(reservations.checkIn, today), inArray(reservations.status, ["new", "confirmed"]))),
    db
      .select({ n: count() })
      .from(reservations)
      .where(and(scope, gte(reservations.createdAt, weekAgo))),
    db.query.reservations.findMany({
      where: scope,
      orderBy: [desc(reservations.createdAt)],
      limit: 5,
      with: { branch: { columns: { name: true } } },
    }),
    user.role === "owner"
      ? db
          .select({
            name: branches.name,
            total: count(reservations.id),
            confirmed: sql<number>`count(*) filter (where ${reservations.status} in ('confirmed','checked_in','completed'))`.mapWith(Number),
          })
          .from(branches)
          .leftJoin(reservations, and(eq(reservations.branchId, branches.id), gte(reservations.createdAt, weekAgo)))
          .groupBy(branches.id, branches.name, branches.sortOrder)
          .orderBy(asc(branches.sortOrder), asc(branches.name))
      : Promise.resolve([]),
  ]);
  return {
    newCount: newReq.n,
    arrivals: arrivals.n,
    week: week.n,
    latest,
    perBranch,
  };
}

/** Placeholder content still live, so the owner can see what needs replacing before launch. */
export async function sampleCounts(user: StaffUser) {
  if (user.role === "front_desk") return null;
  const scope = branchScope(user);
  const [[rooms], [items], [photos], [offs], [brs], settings] = await Promise.all([
    db
      .select({ n: count() })
      .from(roomTypes)
      .where(and(eq(roomTypes.isSample, true), scope ? eq(roomTypes.branchId, scope) : undefined)),
    db
      .select({ n: count() })
      .from(menuItems)
      .innerJoin(menuCategories, eq(menuItems.categoryId, menuCategories.id))
      .where(and(eq(menuItems.isSample, true), scope ? eq(menuCategories.branchId, scope) : undefined)),
    db
      .select({ n: count() })
      .from(galleryImages)
      .where(and(eq(galleryImages.isSample, true), scope ? eq(galleryImages.branchId, scope) : undefined)),
    db
      .select({ n: count() })
      .from(offers)
      .where(and(eq(offers.isSample, true), scope ? eq(offers.branchId, scope) : undefined)),
    db
      .select({ n: count() })
      .from(branches)
      .where(and(eq(branches.isSample, true), scope ? eq(branches.id, scope) : undefined)),
    getSettings(),
  ]);
  const list = [
    { one: "room", label: "rooms", n: rooms.n, href: "/admin/rooms" },
    { one: "menu item", label: "menu items", n: items.n, href: "/admin/menu" },
    { one: "photo", label: "photos", n: photos.n, href: "/admin/gallery" },
    { one: "offer", label: "offers", n: offs.n, href: "/admin/offers" },
    { one: "branch", label: "branches", n: brs.n, href: "/admin/branches" },
  ];
  if (user.role === "owner" && (settings.contactIsSample || settings.houseRulesIsSample)) {
    list.push({
      one: "site settings",
      label: "site settings",
      n: 1,
      href: "/admin/settings",
    });
  }
  return list.filter((x) => x.n > 0);
}

export type ReservationFilters = {
  status?: string;
  branch?: string;
  from?: string;
  to?: string;
  q?: string;
  page?: number;
};
export const PAGE_SIZE = 50;

export async function listReservations(user: StaffUser, f: ReservationFilters) {
  const conds: (SQL | undefined)[] = [scopeRes(user)];
  if (f.status && f.status !== "all") conds.push(eq(reservations.status, f.status as ReservationStatus));
  if (f.branch && user.role === "owner") conds.push(eq(reservations.branchId, f.branch));
  if (f.from) conds.push(gte(reservations.checkIn, f.from));
  if (f.to) conds.push(lte(reservations.checkIn, f.to));
  const q = f.q?.trim();
  if (q) {
    const digits = q.replace(/\D/g, "");
    const like = `%${q.replace(/[%_\\]/g, (c) => "\\" + c)}%`;
    conds.push(
      or(
        ilike(reservations.name, like),
        ilike(reservations.reference, like),
        digits.length >= 4 ? ilike(reservations.phone, `%${digits.replace(/^234/, "")}%`) : undefined,
      ),
    );
  }
  const where = and(...conds);
  const page = Math.max(1, f.page ?? 1);
  const [rows, [{ n }]] = await Promise.all([
    db.query.reservations.findMany({
      where,
      orderBy: [desc(reservations.createdAt)],
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
      with: { branch: { columns: { name: true } } },
    }),
    db.select({ n: count() }).from(reservations).where(where),
  ]);
  return { rows, total: n, page, pages: Math.max(1, Math.ceil(n / PAGE_SIZE)) };
}

/** Over-booking warnings for a set of reservations: requests for a room type on overlapping dates that exceed its units. */
export async function overbookingFor(
  rows: {
    id: string;
    roomTypeId: string | null;
    checkIn: string;
    checkOut: string | null;
    rooms: number;
    status: ReservationStatus;
  }[],
) {
  const targets = rows.filter((r) => r.roomTypeId && HOLDING_STATUSES.includes(r.status));
  if (!targets.length) return new Map<string, { night: string; requested: number; units: number }>();
  const typeIds = [...new Set(targets.map((t) => t.roomTypeId!))];
  const minIn = targets.reduce((m, t) => (t.checkIn < m ? t.checkIn : m), targets[0].checkIn);
  const maxOut = targets.reduce((m, t) => {
    const end = t.checkOut ?? addDays(t.checkIn, 1);
    return end > m ? end : m;
  }, minIn);
  const [holding, types] = await Promise.all([
    db
      .select({
        id: reservations.id,
        roomTypeId: reservations.roomTypeId,
        checkIn: reservations.checkIn,
        checkOut: reservations.checkOut,
        rooms: reservations.rooms,
      })
      .from(reservations)
      .where(
        and(
          inArray(reservations.roomTypeId, typeIds),
          inArray(reservations.status, HOLDING_STATUSES),
          lte(reservations.checkIn, maxOut),
          or(isNull(reservations.checkOut), gte(reservations.checkOut, minIn)),
        ),
      ),
    db.select({ id: roomTypes.id, units: roomTypes.units }).from(roomTypes).where(inArray(roomTypes.id, typeIds)),
  ]);
  return findOverbooked(targets, holding, new Map(types.map((t) => [t.id, t.units])));
}
