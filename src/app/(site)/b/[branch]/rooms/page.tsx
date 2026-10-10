import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/site/site-shell";
import { Frame, Sticker } from "@/components/ui/bits";
import { ArrowLink, ButtonLink } from "@/components/ui/button";
import { formatNaira, shortNaira } from "@/lib/format";
import { getVisibleRooms, hasSample, resolveBranch } from "@/lib/site-data";
import { branchParams } from "@/lib/static-params";

export const revalidate = 3600;
export const generateStaticParams = branchParams;

const WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];

export async function generateMetadata({ params }: PageProps<"/b/[branch]/rooms">): Promise<Metadata> {
  const { branch } = await resolveBranch((await params).branch);
  const rooms = branch ? await getVisibleRooms(branch.id) : [];
  const from = rooms.length ? Math.min(...rooms.map((r) => r.pricePerNight)) : null;
  return {
    title: "Rooms and prices",
    description: `Compare every room at De Classic Hotel${branch ? `, ${branch.name}` : ""}${from ? `, from ${formatNaira(from)} a night` : ""}. Air conditioning, Wi-Fi and a private bathroom in every room.`,
    alternates: { canonical: "/rooms" },
  };
}

export default async function RoomsPage({ params }: PageProps<"/b/[branch]/rooms">) {
  const { branch } = await resolveBranch((await params).branch);
  if (!branch) notFound();
  const rooms = await getVisibleRooms(branch.id);
  const count = WORDS[rooms.length] ?? String(rooms.length);

  return (
    <SiteShell branchSlug={branch.slug} sample={branch.isSample || hasSample(rooms)}>
      <main>
        <section data-anim="wipe" className="bg-aqua pt-[clamp(40px,6vw,80px)] pb-[clamp(140px,16vw,240px)]">
          <div className="wrap flex flex-wrap items-end justify-between gap-x-16 gap-y-6">
            <div>
              <span data-anim="rise" style={{ ["--d" as string]: "160ms" }} className="text-teal mb-4 block text-sm font-semibold">
                rooms{branch.name ? ` · ${branch.name.toLowerCase()}` : ""}
              </span>
              <h1 className="font-display m-0 text-[clamp(48px,8vw,116px)] leading-[0.9] font-extrabold tracking-[-0.055em]">
                <span data-anim="rise" style={{ ["--d" as string]: "220ms" }} className="block">
                  {rooms.length === 1 ? "one room," : `${count} rooms,`}
                </span>
                <span data-anim="rise" style={{ ["--d" as string]: "280ms" }} className="block">
                  all air-cooled
                </span>
              </h1>
            </div>
            <p className="m-0 max-w-[360px] text-[17px] leading-[1.6]">
              Every room has air conditioning, Wi-Fi, a smart TV and its own bathroom. Check in from the afternoon, pay when you arrive.
            </p>
          </div>
        </section>

        <section aria-label="Room list" className="-mt-[clamp(100px,13vw,200px)] pb-[clamp(72px,9vw,128px)]">
          {rooms.length === 0 ? (
            <div className="wrap">
              <div className="rounded-frame bg-aqua-tint flex flex-col items-start gap-5 p-[clamp(32px,5vw,72px)]">
                <h2 className="font-headline m-0 text-[clamp(36px,5vw,72px)]">rooms coming soon</h2>
                <p className="m-0 max-w-[440px] text-[17px] leading-[1.6]">
                  We&apos;re putting the rooms online. Call or WhatsApp the front desk to book in the meantime.
                </p>
                <ButtonLink href="/locations" size="lg">
                  Contact the hotel
                </ButtonLink>
              </div>
            </div>
          ) : (
            <div className="wrap flex flex-wrap items-start gap-x-[clamp(24px,4vw,64px)] gap-y-14">
              {rooms.map((r, i) => (
                <article
                  key={r.id}
                  data-reveal=""
                  className={`flex min-w-[min(100%,300px)] flex-col gap-4 ${i % 2 ? "flex-[5_1_0] md:mt-40" : "flex-[7_1_0]"}`}
                >
                  <Link href={`/rooms/${r.slug}`} className="group relative block" aria-label={`${r.name} details`}>
                    <Frame src={r.images[0]?.url} alt={r.images[0]?.alt || r.name} sizes="(min-width: 760px) 50vw, 100vw" priority={i < 2} />
                    <Sticker size={96} main={shortNaira(r.pricePerNight)} className="absolute -top-4 -right-3" />
                  </Link>
                  <h2 className="font-headline mt-1 text-[clamp(28px,3vw,44px)] lowercase">{r.name}</h2>
                  <span className="text-slate text-base leading-normal">{r.amenities.slice(0, 3).join(" · ")}</span>
                  <div className="border-line flex flex-wrap items-center justify-between gap-4 border-t pt-4">
                    <span>
                      <span className="font-display text-[26px] font-extrabold tracking-[-0.03em]">{formatNaira(r.pricePerNight)}</span>{" "}
                      <span className="text-slate text-sm">per night</span>
                    </span>
                    <div className="flex items-center gap-4">
                      <ArrowLink href={`/rooms/${r.slug}`}>Details</ArrowLink>
                      <ButtonLink href={`/book?branch=${branch.slug}&room=${r.slug}`} className="px-[22px]">
                        Request
                      </ButtonLink>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </SiteShell>
  );
}
