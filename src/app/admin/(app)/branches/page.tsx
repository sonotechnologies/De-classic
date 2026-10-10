import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { ActionLink, EmptyState, PageHeader, Tag } from "@/components/admin/ui";
import { SampleTag } from "@/components/ui/bits";
import { db } from "@/db";
import { roomTypes } from "@/db/schema";
import { branchesFor } from "@/lib/admin-data";
import { OWNER_ONLY, requireUser } from "@/lib/authz";
import { plural } from "@/lib/format";
import { displayInternational } from "@/lib/phone";

export const metadata: Metadata = { title: "Branches" };

export default async function BranchesPage() {
  const user = await requireUser(OWNER_ONLY);
  const list = await branchesFor(user);
  const units = await Promise.all(
    list.map(async (b) => {
      const rows = await db.select({ units: roomTypes.units }).from(roomTypes).where(eq(roomTypes.branchId, b.id));
      return rows.reduce((s, r) => s + r.units, 0);
    }),
  );
  return (
    <>
      <PageHeader
        title="Branches"
        sub="Every room, offer, menu and photo belongs to a branch"
        action={<ActionLink href="/admin/branches/new">Add branch</ActionLink>}
      />
      {list.length === 0 ? (
        <EmptyState
          title="No branches yet"
          body="Add the first branch to start taking bookings."
          action={<ActionLink href="/admin/branches/new">Add branch</ActionLink>}
        />
      ) : (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-3">
          {list.map((b, i) => (
            <div key={b.id} className="rounded-card border-line flex flex-col gap-2.5 border p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-lg font-bold">
                  {b.name} {b.isSample && <SampleTag />}
                </span>
                {b.isPublished ? <Tag tone="green">Taking bookings</Tag> : <Tag tone="grey">Not published</Tag>}
              </div>
              <span className="text-[15px] leading-normal">{b.address}</span>
              <span className="text-slate text-[15px]">
                {displayInternational(b.phone)} · {plural(units[i], "room")}
                {b.allowsShortStay ? " · short stays" : ""}
              </span>
              <Link href={`/admin/branches/${b.id}`} className="mt-1 text-sm font-semibold no-underline">
                Edit branch →
              </Link>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
