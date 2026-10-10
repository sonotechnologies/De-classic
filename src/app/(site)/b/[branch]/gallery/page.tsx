import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GalleryGrid } from "@/components/site/gallery-grid";
import { SiteShell } from "@/components/site/site-shell";
import { getGallery, hasSample, resolveBranch } from "@/lib/site-data";
import { branchParams } from "@/lib/static-params";

export const revalidate = 3600;
export const generateStaticParams = branchParams;

export const metadata: Metadata = {
  title: "Gallery · photos of the rooms and the bar",
  description: "See the rooms, the bar and the building before you come.",
  alternates: { canonical: "/gallery" },
};

export default async function GalleryPage({ params }: PageProps<"/b/[branch]/gallery">) {
  const { branch } = await resolveBranch((await params).branch);
  if (!branch) notFound();
  const photos = await getGallery(branch.id);

  return (
    <SiteShell branchSlug={branch.slug} sample={branch.isSample || hasSample(photos)}>
      <main>
        <GalleryGrid
          photos={photos.map(({ id, url, alt, tag, width, height }) => ({ id, url, alt, tag, width, height }))}
          heading={
            <h1
              data-anim="rise"
              style={{ ["--d" as string]: "120ms" }}
              className="m-0 font-display text-[clamp(48px,8vw,116px)] font-extrabold leading-[0.9] tracking-[-0.055em]"
            >
              have a look
            </h1>
          }
        />
      </main>
    </SiteShell>
  );
}
