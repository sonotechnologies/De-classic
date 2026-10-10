import { desc, inArray } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { ActionLink, EmptyState, PageHeader, Panel, Tag } from "@/components/admin/ui";
import { SampleTag } from "@/components/ui/bits";
import { db } from "@/db";
import { offers } from "@/db/schema";
import { branchesFor } from "@/lib/admin-data";
import { CONTENT_ROLES, requireUser } from "@/lib/authz";
import { offerState, offerWhen } from "@/lib/offer-state";

export const metadata: Metadata = { title: "Offers" };

const TONE = {
  Live: "green",
  Scheduled: "aqua",
  Ended: "grey",
  Off: "grey",
} as const;

export default async function OffersAdminPage() {
  const user = await requireUser(CONTENT_ROLES);
  const branches = await branchesFor(user);
  const list = branches.length
    ? await db.query.offers.findMany({
        where: inArray(
          offers.branchId,
          branches.map((b) => b.id),
        ),
        orderBy: [desc(offers.startsOn)],
      })
    : [];
  const name = new Map(branches.map((b) => [b.id, b.name]));
  const order = { Live: 0, Scheduled: 1, Off: 2, Ended: 3 };
  const sorted = list.map((o) => ({ ...o, state: offerState(o) })).sort((a, b) => order[a.state] - order[b.state]);

  return (
    <>
      <PageHeader
        title="Offers"
        sub="Live offers show on the website automatically"
        action={<ActionLink href="/admin/offers/new">New offer</ActionLink>}
      />
      {sorted.length === 0 ? (
        <EmptyState
          title="No offers yet"
          body="The Offers page tells guests there are no deals right now and points them to the rooms."
          action={<ActionLink href="/admin/offers/new">New offer</ActionLink>}
        />
      ) : (
        <Panel className="flex flex-col">
          {sorted.map((o) => (
            <div key={o.id} className="border-line flex flex-wrap items-center gap-4 border-b px-[18px] py-4 last:border-b-0">
              <div className="flex flex-[1_1_220px] flex-col gap-1">
                <span className="flex flex-wrap items-center gap-2 text-base font-semibold">
                  {o.title.charAt(0).toUpperCase() + o.title.slice(1)}
                  {o.isSample && <SampleTag />}
                </span>
                <span className="text-slate text-sm">
                  {offerWhen(o)}
                  {branches.length > 1 ? ` · ${name.get(o.branchId)}` : ""}
                </span>
              </div>
              <Tag tone={TONE[o.state]}>{o.state}</Tag>
              <Link href={`/admin/offers/${o.id}`} className="text-sm font-semibold no-underline">
                Edit
              </Link>
            </div>
          ))}
        </Panel>
      )}
    </>
  );
}
