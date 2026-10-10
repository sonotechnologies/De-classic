import type { Metadata } from "next";
import Link from "next/link";
import { LocationDetail } from "@/components/site/location-detail";
import { SiteShell } from "@/components/site/site-shell";
import { BuildingDrawing } from "@/components/ui/bits";
import { displayInternational } from "@/lib/phone";
import { hotelJsonLd, JsonLd } from "@/lib/seo";
import { getGallery, getPublishedBranches, getVisibleRooms } from "@/lib/site-data";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Location and directions",
  description: "Find De Classic Hotel in Agric, Ikorodu, Lagos. Address, map, directions, nearby landmarks and phone numbers.",
  alternates: { canonical: "/locations" },
};

export default async function LocationsPage() {
  const branches = await getPublishedBranches();

  // With one branch there is nothing to choose, so show its details straight away.
  if (branches.length === 1) {
    const branch = branches[0];
    const [gallery, rooms] = await Promise.all([getGallery(branch.id), getVisibleRooms(branch.id)]);
    return (
      <SiteShell branchSlug={branch.slug}>
        <JsonLd
          data={hotelJsonLd(
            branch,
            rooms.map((r) => r.pricePerNight),
          )}
        />
        <LocationDetail branch={branch} exterior={gallery.find((g) => g.tag === "exterior")} />
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <main>
        <section data-anim="wipe" className="bg-aqua py-[clamp(40px,6vw,80px)]">
          <div className="wrap">
            <span className="text-teal mb-4 block text-sm font-semibold">locations</span>
            <h1 className="font-display m-0 text-[clamp(48px,8.6vw,124px)] leading-[0.9] font-extrabold tracking-[-0.055em]">
              {branches.length ? "pick your branch" : "coming soon"}
            </h1>
          </div>
        </section>
        <section className="wrap grid grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))] gap-6 py-[clamp(56px,7vw,96px)]">
          {branches.map((b) => (
            <Link key={b.id} href={`/locations/${b.slug}`} className="group text-ink flex flex-col gap-4 no-underline" data-reveal="">
              <BuildingDrawing />
              <span className="font-display text-[clamp(28px,3vw,44px)] leading-[0.95] font-extrabold tracking-[-0.05em] lowercase">{b.name}</span>
              <span className="text-slate text-base leading-normal">{b.address}</span>
              <span className="text-base font-semibold">{displayInternational(b.phone)}</span>
              <span className="text-teal font-semibold">
                Directions and details <span className="inline-block transition-transform duration-[180ms] group-hover:translate-x-1">→</span>
              </span>
            </Link>
          ))}
        </section>
      </main>
    </SiteShell>
  );
}
