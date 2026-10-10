import { asc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { BranchPicker } from "@/components/admin/branch-picker";
import { EmptyState, PageHeader } from "@/components/admin/ui";
import { db } from "@/db";
import { galleryImages } from "@/db/schema";
import { pickBranch } from "@/lib/admin-data";
import { CONTENT_ROLES, requireUser } from "@/lib/authz";
import { plural } from "@/lib/format";
import { GalleryManager } from "./gallery-manager";

export const metadata: Metadata = { title: "Gallery" };

export default async function GalleryAdminPage({ searchParams }: PageProps<"/admin/gallery">) {
  const user = await requireUser(CONTENT_ROLES);
  const { branch: requested } = await searchParams;
  const { list, current } = await pickBranch(user, typeof requested === "string" ? requested : undefined);
  if (!current) return <EmptyState title="Add a branch first" body="Each branch has its own gallery." />;
  const photos = await db
    .select()
    .from(galleryImages)
    .where(eq(galleryImages.branchId, current.id))
    .orderBy(asc(galleryImages.sortOrder), asc(galleryImages.createdAt));

  return (
    <>
      <PageHeader title="Gallery" sub={plural(photos.length, "photo")} action={<BranchPicker branches={list} current={current.id} />} />
      {photos.length === 0 && <EmptyState title="No photos yet" body="Upload photos of rooms, the bar and the building. JPG or PNG." />}
      <GalleryManager
        branchId={current.id}
        photos={photos.map(({ id, url, alt, tag, isSample }) => ({
          id,
          url,
          alt,
          tag,
          isSample,
        }))}
      />
    </>
  );
}
