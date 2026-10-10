"use server";

import { asc, eq, max } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { galleryImages, galleryTagEnum } from "@/db/schema";
import { failure, revalidateSite, type ActionState } from "@/lib/admin-actions";
import { assertBranch, AuthzError, CONTENT_ROLES, requireActionUser } from "@/lib/authz";
import { deleteStoredImage, isAllowedImageUrl } from "@/lib/uploads";

const tag = z.enum(galleryTagEnum.enumValues);

const uploads = z
  .array(
    z.object({
      url: z.string().refine(isAllowedImageUrl, "That photo didn't come from our upload."),
      publicId: z.string().max(300).nullable(),
      width: z.number().int().positive().max(20000),
      height: z.number().int().positive().max(20000),
      name: z.string().max(200),
    }),
  )
  .min(1)
  .max(50);

export async function addGalleryPhotos(branchId: string, photoTag: string, photos: unknown): Promise<ActionState> {
  try {
    const user = await requireActionUser(CONTENT_ROLES);
    assertBranch(user, z.string().uuid().parse(branchId));
    const t = tag.parse(photoTag);
    const list = uploads.parse(photos);
    const [{ next }] = await db
      .select({ next: max(galleryImages.sortOrder) })
      .from(galleryImages)
      .where(eq(galleryImages.branchId, branchId));
    await db.insert(galleryImages).values(
      list.map((p, i) => ({
        branchId,
        url: p.url,
        publicId: p.publicId,
        width: p.width,
        height: p.height,
        tag: t,
        alt: t === "bar" ? "The bar" : t === "exterior" ? "The hotel building" : "A room",
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

async function load(id: string) {
  const user = await requireActionUser(CONTENT_ROLES);
  const img = await db.query.galleryImages.findFirst({
    where: eq(galleryImages.id, z.string().uuid().parse(id)),
  });
  if (!img) throw new AuthzError("That photo no longer exists.");
  assertBranch(user, img.branchId);
  return img;
}

export async function updateGalleryPhoto(id: string, patch: { tag?: string; alt?: string; isSample?: boolean }): Promise<ActionState> {
  try {
    const img = await load(id);
    const v = z
      .object({
        tag: tag.optional(),
        alt: z.string().trim().max(200).optional(),
        isSample: z.boolean().optional(),
      })
      .parse(patch);
    await db.update(galleryImages).set(v).where(eq(galleryImages.id, img.id));
    revalidateSite();
    return { ok: true, message: "Saved" };
  } catch (e) {
    return failure(e);
  }
}

export async function deleteGalleryPhoto(id: string): Promise<ActionState> {
  try {
    const img = await load(id);
    await db.delete(galleryImages).where(eq(galleryImages.id, img.id));
    await deleteStoredImage(img.publicId, img.url);
    revalidateSite();
    return { ok: true, message: "Photo deleted" };
  } catch (e) {
    return failure(e, "Couldn't delete the photo.");
  }
}

export async function moveGalleryPhoto(id: string, dir: -1 | 1): Promise<ActionState> {
  try {
    const img = await load(id);
    const all = await db
      .select({ id: galleryImages.id })
      .from(galleryImages)
      .where(eq(galleryImages.branchId, img.branchId))
      .orderBy(asc(galleryImages.sortOrder), asc(galleryImages.createdAt));
    const i = all.findIndex((x) => x.id === img.id);
    const j = i + dir;
    if (j < 0 || j >= all.length) return { ok: true };
    [all[i], all[j]] = [all[j], all[i]];
    await db.transaction(async (tx) => {
      for (const [k, x] of all.entries()) await tx.update(galleryImages).set({ sortOrder: k }).where(eq(galleryImages.id, x.id));
    });
    revalidateSite();
    return { ok: true };
  } catch (e) {
    return failure(e);
  }
}
