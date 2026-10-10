"use server";

import { and, asc, eq, max, ne } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { roomImages, roomTypes } from "@/db/schema";
import { checkbox, failure, formObject, nairaField, optionalNairaField, revalidateSite, zodErrors, type ActionState } from "@/lib/admin-actions";
import { assertBranch, AuthzError, CONTENT_ROLES, requireActionUser } from "@/lib/authz";
import { slugify } from "@/lib/format";
import { deleteStoredImage, isAllowedImageUrl } from "@/lib/uploads";

const roomSchema = z.object({
  branchId: z.string().uuid("Pick a branch."),
  name: z.string().trim().min(2, "Give the room a name.").max(60),
  slug: z.string().trim().max(60).optional().default(""),
  tagline: z.string().trim().max(80).optional().default(""),
  description: z.string().trim().max(1200, "Keep the description under 1,200 characters.").optional().default(""),
  price: nairaField("price"),
  shortStayPrice: optionalNairaField("short stay price"),
  capacity: z.coerce.number({ message: "Use a number." }).int().min(1, "At least 1 guest.").max(12),
  units: z.coerce.number({ message: "Use a number." }).int().min(1, "At least 1 room.").max(500),
  amenities: z.string().trim().max(1000).optional().default(""),
  isVisible: checkbox,
  isSample: checkbox,
});

async function loadRoom(id: string) {
  const user = await requireActionUser(CONTENT_ROLES);
  const room = await db.query.roomTypes.findFirst({
    where: eq(roomTypes.id, z.string().uuid().parse(id)),
  });
  if (!room) throw new AuthzError("That room no longer exists.");
  assertBranch(user, room.branchId);
  return { user, room };
}

export async function saveRoom(id: string | null, _prev: ActionState, fd: FormData): Promise<ActionState> {
  let createdId: string | null = null;
  try {
    const user = await requireActionUser(CONTENT_ROLES);
    const raw = formObject(fd);
    if (user.role !== "owner") raw.branchId = user.branchId;
    const parsed = roomSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, errors: zodErrors(parsed.error) };
    const v = parsed.data;
    assertBranch(user, v.branchId);
    if (id) await loadRoom(id);

    const slug = slugify(v.slug || v.name);
    if (!slug)
      return {
        ok: false,
        errors: { slug: "Use letters or numbers in the web address." },
      };
    const clash = await db.query.roomTypes.findFirst({
      where: and(eq(roomTypes.branchId, v.branchId), eq(roomTypes.slug, slug), id ? ne(roomTypes.id, id) : undefined),
      columns: { id: true },
    });
    if (clash)
      return {
        ok: false,
        errors: {
          slug: "Another room in this branch already uses that web address.",
        },
      };

    const values = {
      branchId: v.branchId,
      name: v.name,
      slug,
      tagline: v.tagline.toLowerCase(),
      description: v.description,
      pricePerNight: v.price,
      shortStayPrice: v.shortStayPrice,
      capacity: v.capacity,
      units: v.units,
      amenities: v.amenities
        .split(/[\n,]/)
        .map((a) => a.trim())
        .filter(Boolean)
        .slice(0, 30),
      isVisible: v.isVisible,
      isSample: v.isSample,
    };

    if (id) {
      await db.update(roomTypes).set(values).where(eq(roomTypes.id, id));
    } else {
      const [{ next }] = await db
        .select({ next: max(roomTypes.sortOrder) })
        .from(roomTypes)
        .where(eq(roomTypes.branchId, v.branchId));
      const [row] = await db
        .insert(roomTypes)
        .values({ ...values, sortOrder: (next ?? -1) + 1 })
        .returning({ id: roomTypes.id });
      createdId = row.id;
    }
    revalidateSite();
  } catch (e) {
    return failure(e);
  }
  if (createdId) return { ok: true, message: "Room added. Now add photos.", redirectTo: `/admin/rooms/${createdId}` };
  return { ok: true, message: "Saved" };
}

/** Deletes the room type. Past reservations keep the room name; their link to the room is cleared. */
export async function deleteRoom(id: string): Promise<ActionState> {
  try {
    const { room } = await loadRoom(id);
    const images = await db.select().from(roomImages).where(eq(roomImages.roomTypeId, room.id));
    await db.delete(roomTypes).where(eq(roomTypes.id, room.id));
    await Promise.all(images.map((i) => deleteStoredImage(i.publicId, i.url)));
    revalidateSite();
    return { ok: true, message: "Room deleted" };
  } catch (e) {
    return failure(e, "Couldn't delete the room. Try again.");
  }
}

const photoSchema = z.array(
  z.object({
    url: z.string().refine(isAllowedImageUrl, "That photo didn't come from our upload."),
    publicId: z.string().max(300).nullable(),
    name: z.string().max(200),
  }),
);

export async function addRoomPhotos(roomId: string, photos: unknown): Promise<ActionState> {
  try {
    const { room } = await loadRoom(roomId);
    const list = photoSchema.parse(photos);
    const [{ next }] = await db
      .select({ next: max(roomImages.sortOrder) })
      .from(roomImages)
      .where(eq(roomImages.roomTypeId, room.id));
    await db.insert(roomImages).values(
      list.map((p, i) => ({
        roomTypeId: room.id,
        url: p.url,
        publicId: p.publicId,
        alt: `${room.name}`,
        sortOrder: (next ?? -1) + 1 + i,
      })),
    );
    revalidateSite();
    return {
      ok: true,
      message: `${list.length} photo${list.length === 1 ? "" : "s"} added`,
    };
  } catch (e) {
    return failure(e, "Couldn't save the photos.");
  }
}

async function loadImage(imageId: string) {
  const img = await db.query.roomImages.findFirst({
    where: eq(roomImages.id, z.string().uuid().parse(imageId)),
  });
  if (!img) throw new AuthzError("That photo no longer exists.");
  const { room } = await loadRoom(img.roomTypeId);
  return { img, room };
}

export async function deleteRoomPhoto(imageId: string): Promise<ActionState> {
  try {
    const { img } = await loadImage(imageId);
    await db.delete(roomImages).where(eq(roomImages.id, img.id));
    await deleteStoredImage(img.publicId, img.url);
    revalidateSite();
    return { ok: true, message: "Photo removed" };
  } catch (e) {
    return failure(e, "Couldn't remove the photo.");
  }
}

/** Moves a photo one place earlier or later. The first photo is the one on the room card. */
export async function moveRoomPhoto(imageId: string, dir: -1 | 1): Promise<ActionState> {
  try {
    const { img } = await loadImage(imageId);
    const all = await db
      .select()
      .from(roomImages)
      .where(eq(roomImages.roomTypeId, img.roomTypeId))
      .orderBy(asc(roomImages.sortOrder), asc(roomImages.createdAt));
    const i = all.findIndex((x) => x.id === img.id);
    const j = i + dir;
    if (j < 0 || j >= all.length) return { ok: true };
    [all[i], all[j]] = [all[j], all[i]];
    await db.transaction(async (tx) => {
      for (const [k, x] of all.entries()) await tx.update(roomImages).set({ sortOrder: k }).where(eq(roomImages.id, x.id));
    });
    revalidateSite();
    return { ok: true };
  } catch (e) {
    return failure(e, "Couldn't move the photo.");
  }
}

export async function saveRoomPhotoAlt(imageId: string, alt: string): Promise<ActionState> {
  try {
    const { img } = await loadImage(imageId);
    await db
      .update(roomImages)
      .set({ alt: z.string().trim().max(200).parse(alt) })
      .where(eq(roomImages.id, img.id));
    revalidateSite();
    return { ok: true, message: "Description saved" };
  } catch (e) {
    return failure(e);
  }
}
