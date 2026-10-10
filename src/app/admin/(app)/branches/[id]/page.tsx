import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ConfirmButton } from "@/components/admin/confirm";
import { PageHeader } from "@/components/admin/ui";
import { db } from "@/db";
import { branches } from "@/db/schema";
import { OWNER_ONLY, requireUser } from "@/lib/authz";
import { deleteBranch } from "../actions";
import { BranchForm } from "../branch-form";

export const metadata: Metadata = { title: "Edit branch" };

export default async function EditBranchPage({ params }: PageProps<"/admin/branches/[id]">) {
  await requireUser(OWNER_ONLY);
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const branch = await db.query.branches.findFirst({
    where: eq(branches.id, id),
  });
  if (!branch) notFound();
  return (
    <>
      <PageHeader
        back={{ href: "/admin/branches", label: "Branches" }}
        title={`Edit ${branch.name}`}
        action={
          <ConfirmButton
            label="Delete branch"
            title={`Delete ${branch.name}?`}
            body="This removes the branch with its rooms, offers, menu and photos. Branches with reservations can only be unpublished."
            confirmLabel="Delete branch"
            run={deleteBranch.bind(null, branch.id)}
            redirectTo="/admin/branches"
          />
        }
      />
      <BranchForm branch={branch} />
    </>
  );
}
