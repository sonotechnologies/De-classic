import { asc, inArray } from "drizzle-orm";
import type { Metadata } from "next";
import { EmptyState, PageHeader } from "@/components/admin/ui";
import { db } from "@/db";
import { roomTypes } from "@/db/schema";
import { pickBranch } from "@/lib/admin-data";
import { CONTENT_ROLES, requireUser } from "@/lib/authz";
import { OfferForm } from "../offer-form";

export const metadata: Metadata = { title: "New offer" };

export default async function NewOfferPage() {
  const user = await requireUser(CONTENT_ROLES);
  const { list, current } = await pickBranch(user, undefined);
  const rooms = list.length
    ? await db
        .select()
        .from(roomTypes)
        .where(
          inArray(
            roomTypes.branchId,
            list.map((b) => b.id),
          ),
        )
        .orderBy(asc(roomTypes.sortOrder))
    : [];
  return (
    <>
      <PageHeader back={{ href: "/admin/offers", label: "Offers" }} title="New offer" />
      {current ? (
        <OfferForm branches={list} rooms={rooms} canPickBranch={user.role === "owner"} defaultBranch={current.id} />
      ) : (
        <EmptyState title="Add a branch first" body="Offers belong to a branch." />
      )}
    </>
  );
}
