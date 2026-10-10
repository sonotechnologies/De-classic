import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LocationDetail } from "@/components/site/location-detail";
import { SiteShell } from "@/components/site/site-shell";
import { hotelJsonLd, JsonLd } from "@/lib/seo";
import { getBranchBySlug, getGallery, getPublishedBranches, getVisibleRooms } from "@/lib/site-data";

export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    return (await getPublishedBranches()).map((b) => ({ slug: b.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps<"/locations/[slug]">): Promise<Metadata> {
  const branch = await getBranchBySlug((await params).slug);
  if (!branch) return { title: "Location not found" };
  return {
    title: `De Classic Hotel, ${branch.name} · directions`,
    description: `${branch.address}. Map, directions, nearby landmarks, phone and WhatsApp for De Classic Hotel, ${branch.name}.`,
    alternates: { canonical: `/locations/${branch.slug}` },
  };
}

export default async function LocationPage({ params }: PageProps<"/locations/[slug]">) {
  const branch = await getBranchBySlug((await params).slug);
  if (!branch) notFound();
  const [gallery, rooms] = await Promise.all([getGallery(branch.id), getVisibleRooms(branch.id)]);
  return (
    <SiteShell branchSlug={branch.slug}>
      <JsonLd data={hotelJsonLd(branch, rooms.map((r) => r.pricePerNight))} />
      <LocationDetail branch={branch} exterior={gallery.find((g) => g.tag === "exterior")} />
    </SiteShell>
  );
}
