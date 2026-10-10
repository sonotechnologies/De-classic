import { asc, inArray } from "drizzle-orm";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ActionLink, EmptyState, PageHeader, Panel, rowLink } from "@/components/admin/ui";
import { SampleTag } from "@/components/ui/bits";
import { db } from "@/db";
import { roomImages, roomTypes } from "@/db/schema";
import { branchesFor } from "@/lib/admin-data";
import { CONTENT_ROLES, requireUser } from "@/lib/authz";
import { formatNaira, plural } from "@/lib/format";

export const metadata: Metadata = { title: "Rooms" };

export default async function RoomsAdminPage() {
  const user = await requireUser(CONTENT_ROLES);
  const branches = await branchesFor(user);
  const rooms = branches.length
    ? await db.query.roomTypes.findMany({
        where: inArray(
          roomTypes.branchId,
          branches.map((b) => b.id),
        ),
        orderBy: [asc(roomTypes.sortOrder), asc(roomTypes.pricePerNight)],
        with: { images: { orderBy: [asc(roomImages.sortOrder)], limit: 1 } },
      })
    : [];
  const name = new Map(branches.map((b) => [b.id, b.name]));
  const multi = branches.length > 1;

  return (
    <>
      <PageHeader title="Rooms" sub="Changes show on the website straight away" action={<ActionLink href="/admin/rooms/new">Add room</ActionLink>} />
      {rooms.length === 0 ? (
        <EmptyState
          title="No rooms yet"
          body="Add your first room type. It shows on the website once you switch it on."
          action={<ActionLink href="/admin/rooms/new">Add room</ActionLink>}
        />
      ) : (
        <Panel className="flex flex-col">
          {rooms.map((r) => (
            <Link key={r.id} href={`/admin/rooms/${r.id}`} className={rowLink}>
              <div className="rounded-field bg-aqua-tint relative size-16 flex-none overflow-hidden">
                {r.images[0] && <Image src={r.images[0].url} alt="" fill sizes="64px" className="object-cover" />}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-semibold">{r.name}</span>
                  {r.isSample && <SampleTag />}
                </span>
                <span className="text-slate text-sm">
                  {formatNaira(r.pricePerNight)} · {plural(r.units, "room")}
                  {multi ? ` · ${name.get(r.branchId)}` : ""}
                </span>
              </div>
              <span className={`flex-none text-[13px] font-semibold ${r.isVisible ? "text-success" : "text-slate"}`}>
                {r.isVisible ? "On website" : "Hidden"}
              </span>
            </Link>
          ))}
        </Panel>
      )}
    </>
  );
}
