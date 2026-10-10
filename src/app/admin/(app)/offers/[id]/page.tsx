import { asc, eq, inArray } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ConfirmButton } from "@/components/admin/confirm";
import { PageHeader } from "@/components/admin/ui";
import { db } from "@/db";
import { offers, roomTypes } from "@/db/schema";
import { branchesFor } from "@/lib/admin-data";
import { canAccessBranch, CONTENT_ROLES, requireUser } from "@/lib/authz";
import { deleteOffer } from "../actions";
import { OfferForm } from "../offer-form";

export const metadata: Metadata = { title: "Edit offer" };

export default async function EditOfferPage({ params }: PageProps<"/admin/offers/[id]">) {
  const user = await requireUser(CONTENT_ROLES);
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const offer = await db.query.offers.findFirst({
    where: eq(offers.id, id),
    with: { roomLinks: true },
  });
  if (!offer || !canAccessBranch(user, offer.branchId)) notFound();
  const branches = await branchesFor(user);
  const rooms = await db
    .select()
    .from(roomTypes)
    .where(
      inArray(
        roomTypes.branchId,
        branches.map((b) => b.id),
      ),
    )
    .orderBy(asc(roomTypes.sortOrder));
  return (
    <>
      <PageHeader
        back={{ href: "/admin/offers", label: "Offers" }}
        title="Edit offer"
        action={
          <ConfirmButton
            label="Delete offer"
            title="Delete this offer?"
            body="It disappears from the website. Past requests that used it keep the offer name."
            confirmLabel="Delete offer"
            run={deleteOffer.bind(null, offer.id)}
            redirectTo="/admin/offers"
          />
        }
      />
      <OfferForm
        offer={offer}
        linked={offer.roomLinks.map((l) => l.roomTypeId)}
        branches={branches}
        rooms={rooms}
        canPickBranch={user.role === "owner"}
        defaultBranch={offer.branchId}
      />
    </>
  );
}
