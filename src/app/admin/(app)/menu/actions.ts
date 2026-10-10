"use server";

import { asc, eq, max } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { menuCategories, menuItems } from "@/db/schema";
import { checkbox, failure, formObject, nairaField, revalidateSite, zodErrors, type ActionState } from "@/lib/admin-actions";
import { assertBranch, AuthzError, CONTENT_ROLES, requireActionUser } from "@/lib/authz";

const uuid = z.string().uuid();

async function loadCategory(id: string) {
  const user = await requireActionUser(CONTENT_ROLES);
  const cat = await db.query.menuCategories.findFirst({
    where: eq(menuCategories.id, uuid.parse(id)),
  });
  if (!cat) throw new AuthzError("That category no longer exists.");
  assertBranch(user, cat.branchId);
  return cat;
}

async function loadItem(id: string) {
  const item = await db.query.menuItems.findFirst({
    where: eq(menuItems.id, uuid.parse(id)),
  });
  if (!item) throw new AuthzError("That item no longer exists.");
  await loadCategory(item.categoryId);
  return item;
}

const catName = z.string().trim().min(1, "Give the category a name.").max(40);

export async function addCategory(branchId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const user = await requireActionUser(CONTENT_ROLES);
    assertBranch(user, uuid.parse(branchId));
    const name = catName.safeParse(fd.get("name"));
    if (!name.success) return { ok: false, errors: { name: name.error.issues[0].message } };
    const [{ next }] = await db
      .select({ next: max(menuCategories.sortOrder) })
      .from(menuCategories)
      .where(eq(menuCategories.branchId, branchId));
    await db.insert(menuCategories).values({
      branchId,
      name: name.data.toLowerCase(),
      sortOrder: (next ?? -1) + 1,
    });
    revalidateSite();
    return { ok: true, message: "Category added" };
  } catch (e) {
    return failure(e);
  }
}

export async function renameCategory(id: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const cat = await loadCategory(id);
    const name = catName.safeParse(fd.get("name"));
    if (!name.success) return { ok: false, errors: { name: name.error.issues[0].message } };
    await db.update(menuCategories).set({ name: name.data.toLowerCase() }).where(eq(menuCategories.id, cat.id));
    revalidateSite();
    return { ok: true, message: "Saved" };
  } catch (e) {
    return failure(e);
  }
}

export async function deleteCategory(id: string): Promise<ActionState> {
  try {
    const cat = await loadCategory(id);
    await db.delete(menuCategories).where(eq(menuCategories.id, cat.id));
    revalidateSite();
    return { ok: true, message: "Category deleted" };
  } catch (e) {
    return failure(e, "Couldn't delete the category.");
  }
}

export async function moveCategory(id: string, dir: -1 | 1): Promise<ActionState> {
  try {
    const cat = await loadCategory(id);
    const all = await db
      .select()
      .from(menuCategories)
      .where(eq(menuCategories.branchId, cat.branchId))
      .orderBy(asc(menuCategories.sortOrder), asc(menuCategories.name));
    const i = all.findIndex((c) => c.id === cat.id);
    const j = i + dir;
    if (j < 0 || j >= all.length) return { ok: true };
    [all[i], all[j]] = [all[j], all[i]];
    await db.transaction(async (tx) => {
      for (const [k, c] of all.entries()) await tx.update(menuCategories).set({ sortOrder: k }).where(eq(menuCategories.id, c.id));
    });
    revalidateSite();
    return { ok: true };
  } catch (e) {
    return failure(e);
  }
}

const itemSchema = z.object({
  name: z.string().trim().min(1, "Give the item a name.").max(80),
  description: z.string().trim().max(200).optional().default(""),
  price: nairaField("price"),
  isAvailable: checkbox,
  isSample: checkbox,
});

/** Adds an item to a category (`itemId` null) or edits an existing one. */
export async function saveItem(categoryId: string, itemId: string | null, _prev: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const cat = await loadCategory(categoryId);
    const parsed = itemSchema.safeParse(formObject(fd));
    if (!parsed.success) return { ok: false, errors: zodErrors(parsed.error) };
    if (itemId) {
      const item = await loadItem(itemId);
      await db.update(menuItems).set(parsed.data).where(eq(menuItems.id, item.id));
    } else {
      const [{ next }] = await db
        .select({ next: max(menuItems.sortOrder) })
        .from(menuItems)
        .where(eq(menuItems.categoryId, cat.id));
      await db.insert(menuItems).values({
        ...parsed.data,
        categoryId: cat.id,
        sortOrder: (next ?? -1) + 1,
      });
    }
    revalidateSite();
    return { ok: true, message: itemId ? "Saved" : "Item added" };
  } catch (e) {
    return failure(e);
  }
}

export async function setItemAvailable(itemId: string, available: boolean): Promise<ActionState> {
  try {
    const item = await loadItem(itemId);
    await db.update(menuItems).set({ isAvailable: available }).where(eq(menuItems.id, item.id));
    revalidateSite();
    return {
      ok: true,
      message: available ? `${item.name} is back on the menu` : `${item.name} marked unavailable`,
    };
  } catch (e) {
    return failure(e);
  }
}

export async function deleteItem(itemId: string): Promise<ActionState> {
  try {
    const item = await loadItem(itemId);
    await db.delete(menuItems).where(eq(menuItems.id, item.id));
    revalidateSite();
    return { ok: true, message: "Item deleted" };
  } catch (e) {
    return failure(e);
  }
}
