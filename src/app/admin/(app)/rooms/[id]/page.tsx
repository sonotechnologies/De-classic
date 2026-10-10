import { asc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ConfirmButton } from "@/components/admin/confirm";
import { PageHeader } from "@/components/admin/ui";
import { db } from "@/db";
import { roomImages, roomTypes } from "@/db/schema";
import { branchesFor } from "@/lib/admin-data";
import { canAccessBranch, CONTENT_ROLES, requireUser } from "@/lib/authz";
import { deleteRoom } from "../actions";
import { RoomForm } from "../room-form";
import { RoomPhotos } from "../room-photos";

export const metadata: Metadata = { title: "Edit room" };

export default async function EditRoomPage({ params }: PageProps<"/admin/rooms/[id]">) {
  const user = await requireUser(CONTENT_ROLES);
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const room = await db.query.roomTypes.findFirst({
    where: eq(roomTypes.id, id),
    with: { images: { orderBy: [asc(roomImages.sortOrder)] } },
  });
  if (!room || !canAccessBranch(user, room.branchId)) notFound();
  const branches = await branchesFor(user);

  return (
    <>
      <PageHeader
        back={{ href: "/admin/rooms", label: "Rooms" }}
        title={`Edit ${room.name.toLowerCase()}`}
        action={
          <ConfirmButton
            label="Delete room"
            title={`Delete ${room.name.toLowerCase()}?`}
            body="It will disappear from the website. Past reservations for this room are kept."
            confirmLabel="Delete room"
            run={deleteRoom.bind(null, room.id)}
            redirectTo="/admin/rooms"
          />
        }
      />
      <RoomPhotos roomId={room.id} photos={room.images.map((i) => ({ id: i.id, url: i.url, alt: i.alt }))} />
      <RoomForm room={room} branches={branches} canPickBranch={user.role === "owner"} defaultBranch={room.branchId} />
    </>
  );
}
