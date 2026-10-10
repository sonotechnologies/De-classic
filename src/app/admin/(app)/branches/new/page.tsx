import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { OWNER_ONLY, requireUser } from "@/lib/authz";
import { BranchForm } from "../branch-form";

export const metadata: Metadata = { title: "Add branch" };

export default async function NewBranchPage() {
  await requireUser(OWNER_ONLY);
  return (
    <>
      <PageHeader back={{ href: "/admin/branches", label: "Branches" }} title="Add branch" sub="Add its rooms, menu and photos, then publish it." />
      <BranchForm />
    </>
  );
}
