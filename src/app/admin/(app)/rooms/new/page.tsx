import type { Metadata } from "next";
import { EmptyState, PageHeader } from "@/components/admin/ui";
import { pickBranch } from "@/lib/admin-data";
import { CONTENT_ROLES, requireUser } from "@/lib/authz";
import { RoomForm } from "../room-form";

export const metadata: Metadata = { title: "Add room" };

export default async function NewRoomPage() {
  const user = await requireUser(CONTENT_ROLES);
  const { list, current } = await pickBranch(user, undefined);
  return (
    <>
      <PageHeader back={{ href: "/admin/rooms", label: "Rooms" }} title="Add room" sub="You can add photos after saving." />
      {current ? (
        <RoomForm branches={list} canPickBranch={user.role === "owner"} defaultBranch={current.id} />
      ) : (
        <EmptyState title="Add a branch first" body="Rooms belong to a branch. Create the branch, then add its rooms." />
      )}
    </>
  );
}
