import "server-only";
import { and, asc, eq, gte, isNull, lte, or } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/db";
import { branches, galleryImages, menuCategories, menuItems, offers, roomImages, roomTypes, type Branch } from "@/db/schema";
import { todayInLagos } from "./format";

/** Slug used when the visitor has not picked a branch: resolves to the first published branch. */
export const DEFAULT_BRANCH_TOKEN = "_";

export const getPublishedBranches = cache(async (): Promise<Branch[]> => {
  return db.select().from(branches).where(eq(branches.isPublished, true)).orderBy(asc(branches.sortOrder), asc(branches.name));
});

/**
 * Resolves a branch slug from the URL or cookie. Unknown, unpublished or default tokens
 * fall back to the first published branch, so a stale cookie never breaks the site.
 */
export const resolveBranch = cache(async (slug: string | undefined) => {
  const all = await getPublishedBranches();
  const branch = all.find((b) => b.slug === slug) ?? all[0] ?? null;
  return { branch, branches: all, multi: all.length > 1 };
});

export const getBranchBySlug = cache(async (slug: string) => {
  const all = await getPublishedBranches();
  return all.find((b) => b.slug === slug) ?? null;
});

export async function getVisibleRooms(branchId: string) {
  return db.query.roomTypes.findMany({
    where: and(eq(roomTypes.branchId, branchId), eq(roomTypes.isVisible, true)),
    orderBy: [asc(roomTypes.sortOrder), asc(roomTypes.pricePerNight)],
    with: { images: { orderBy: [asc(roomImages.sortOrder)] } },
  });
}

export type PublicRoom = Awaited<ReturnType<typeof getVisibleRooms>>[number];

export async function getVisibleRoom(branchId: string, slug: string) {
  return db.query.roomTypes.findFirst({
    where: and(eq(roomTypes.branchId, branchId), eq(roomTypes.slug, slug), eq(roomTypes.isVisible, true)),
    with: { images: { orderBy: [asc(roomImages.sortOrder)] } },
  });
}

/** Offers live today: switched on, started, and not past their end date. Expired offers drop off on their own. */
export async function getActiveOffers(branchId: string, today = todayInLagos()) {
  return db.query.offers.findMany({
    where: and(
      eq(offers.branchId, branchId),
      eq(offers.isActive, true),
      lte(offers.startsOn, today),
      or(isNull(offers.endsOn), gte(offers.endsOn, today)),
    ),
    orderBy: [asc(offers.endsOn), asc(offers.createdAt)],
    with: { roomLinks: true },
  });
}

export type PublicOffer = Awaited<ReturnType<typeof getActiveOffers>>[number];

export async function getMenu(branchId: string) {
  const cats = await db.query.menuCategories.findMany({
    where: eq(menuCategories.branchId, branchId),
    orderBy: [asc(menuCategories.sortOrder), asc(menuCategories.name)],
    with: {
      items: {
        where: eq(menuItems.isAvailable, true),
        orderBy: [asc(menuItems.sortOrder), asc(menuItems.name)],
      },
    },
  });
  return cats.filter((c) => c.items.length > 0);
}

export async function getGallery(branchId: string) {
  return db
    .select()
    .from(galleryImages)
    .where(eq(galleryImages.branchId, branchId))
    .orderBy(asc(galleryImages.sortOrder), asc(galleryImages.createdAt));
}

export function lowestPrice(rooms: { pricePerNight: number }[]): number | null {
  return rooms.length ? Math.min(...rooms.map((r) => r.pricePerNight)) : null;
}

/** Whether any public content for the branch is still placeholder, so pages can show the stand-in note. */
export function hasSample(...groups: { isSample: boolean }[][]): boolean {
  return groups.some((g) => g.some((x) => x.isSample));
}
