import "server-only";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/auth";
import { db } from "@/db";
import { users, type Role, type User } from "@/db/schema";

export type StaffUser = Pick<User, "id" | "name" | "email" | "role" | "branchId" | "mustChangePassword">;

/**
 * The signed-in staff member, re-read from the database on every request so that a role change,
 * branch move or deactivation takes effect immediately rather than when the session expires.
 */
export const getCurrentUser = cache(async (): Promise<StaffUser | null> => {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  const user = await db.query.users.findFirst({
    where: eq(users.id, id),
    columns: {
      id: true,
      name: true,
      email: true,
      role: true,
      branchId: true,
      mustChangePassword: true,
      isActive: true,
    },
  });
  if (!user || !user.isActive) return null;
  // Branch staff must belong to a branch; without one they can see nothing.
  if (user.role !== "owner" && !user.branchId) return null;
  return user;
});

/** For admin pages: redirects to login when signed out, 404s when the role is not allowed. */
export async function requireUser(roles?: Role[]): Promise<StaffUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  if (roles && !roles.includes(user.role)) notFound();
  return user;
}

export class AuthzError extends Error {}

/** For server actions: throws instead of redirecting so the action can report a plain error. */
export async function requireActionUser(roles?: Role[]): Promise<StaffUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthzError("Your session has ended. Sign in again.");
  if (roles && !roles.includes(user.role)) throw new AuthzError("You don't have permission to do that.");
  return user;
}

export const CONTENT_ROLES: Role[] = ["owner", "manager"];
export const OWNER_ONLY: Role[] = ["owner"];

/** Branch IDs this user may act on, or null for every branch. */
export function branchScope(user: StaffUser): string | null {
  return user.role === "owner" ? null : user.branchId;
}

export function canAccessBranch(user: StaffUser, branchId: string): boolean {
  return user.role === "owner" || user.branchId === branchId;
}

export function assertBranch(user: StaffUser, branchId: string) {
  if (!canAccessBranch(user, branchId)) throw new AuthzError("That belongs to another branch.");
}
