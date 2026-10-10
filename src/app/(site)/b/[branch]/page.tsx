import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookingBar } from "@/components/site/booking-bar";
import { SiteShell } from "@/components/site/site-shell";
import { BuildingDrawing, Frame, Label, Sticker } from "@/components/ui/bits";
import { ArrowLink, ButtonA, ButtonLink } from "@/components/ui/button";
import { barOpening, nearestLandmark, offerTag, shortAddress } from "@/lib/copy";
import { formatNaira, shortNaira } from "@/lib/format";
import { telHref } from "@/lib/phone";
import { hotelJsonLd, JsonLd } from "@/lib/seo";
import { getActiveOffers, getGallery, getVisibleRooms, hasSample, lowestPrice, resolveBranch } from "@/lib/site-data";
import { branchParams } from "@/lib/static-params";

export const revalidate = 3600;
export const generateStaticParams = branchParams;

export async function generateMetadata({ params }: PageProps<"/b/[branch]">): Promise<Metadata> {
  const { branch } = await resolveBranch((await params).branch);
  const where = branch ? `${branch.area || branch.name}, Lagos` : "Ikorodu, Lagos";
  return {
    title: {
      absolute: `De Classic Hotel · Hotel in ${where.replace(/\b\w/g, (c) => c.toUpperCase())}`,
    },
    description: `Clean, modern hotel rooms in ${where.replace(/\b\w/g, (c) => c.toUpperCase())}, with a bar downstairs. Send a reservation request in under a minute and the front desk confirms by call or WhatsApp.`,
    alternates: { canonical: "/" },
  };
}

const NUMBER_WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];

export default async function HomePage({ params }: PageProps<"/b/[branch]">) {
  const { branch: slug } = await params;
  const { branch, branches } = await resolveBranch(slug);
  if (!branch) notFound();

  const [rooms, offers, gallery, allRooms] = await Promise.all([
    getVisibleRooms(branch.id),
    getActiveOffers(branch.id),
    getGallery(branch.id),
    Promise.all(
      branches.map(async (b) => ({
        slug: b.slug,
        name: b.name,
        rooms: await getVisibleRooms(b.id),
      })),
    ),
  ]);

  const from = lowestPrice(rooms);
  const heroPhoto = rooms[0]?.images[0];
  const bar = barOpening(branch);
  const barPhoto = gallery.find((g) => g.tag === "bar");
  const exterior = gallery.find((g) => g.tag === "exterior");
  const strip = gallery.filter((g) => g.tag !== "exterior").slice(0, 5);
  const landmark = nearestLandmark(branch);
  const sample = branch.isSample || hasSample(rooms, offers, gallery);
  const town = branch.name.toLowerCase();

  const intro = [
    from != null ? `Clean, modern rooms from ${formatNaira(from)} a night` : "Clean, modern rooms",
    landmark ? `, ${landmark}.` : ".",
    bar ? ` The bar downstairs opens at ${bar.word}.` : "",
  ].join("");

  return (
    <SiteShell branchSlug={branch.slug} sample={sample}>
      <JsonLd
        data={hotelJsonLd(
          branch,
          rooms.map((r) => r.pricePerNight),
        )}
      />
      <main>
        {/* Hero: the paint line. Aqua above, white below, headline breaking across it. */}
        <section aria-label="Welcome" className="relative">
          <div data-anim="wipe" className="bg-aqua pt-[clamp(40px,6vw,88px)]">
            <div className="wrap">
              <div className="md:max-w-[calc(100%-clamp(0px,36vw,520px))]">
                <span data-anim="rise" style={{ ["--d" as string]: "200ms" }} className="text-teal mb-5 block text-sm font-semibold">
                  {branch.area || town} · rooms and a bar
                </span>
                <h1
                  aria-label={`your room in ${town} is ready`}
                  className="font-display m-0 text-[clamp(48px,8.3vw,120px)] leading-[0.92] font-extrabold tracking-[-0.055em]"
                >
                  <span data-anim="rise" style={{ ["--d" as string]: "260ms" }} className="block">
                    your room
                  </span>
                  <span data-anim="rise" style={{ ["--d" as string]: "320ms" }} className="block">
                    in {town}
                  </span>
                </h1>
              </div>
            </div>
          </div>
          <div className="wrap">
            <div
              aria-hidden="true"
              data-anim="rise"
              style={{ ["--d" as string]: "380ms" }}
              className="font-display pt-[0.04em] text-[clamp(48px,8.3vw,120px)] leading-[0.92] font-extrabold tracking-[-0.055em]"
            >
              is ready
            </div>
            <div className="mt-6 md:hidden">
              <Frame src={heroPhoto?.url} alt={heroPhoto?.alt || "Room photo"} sizes="(max-width: 759px) 100vw, 1px" priority />
            </div>
            <div className="mt-7 md:max-w-[calc(100%-clamp(0px,36vw,520px))]">
              <p className="text-slate m-0 max-w-[420px] text-[clamp(16px,1.4vw,19px)] leading-[1.6] text-pretty">{intro}</p>
            </div>
          </div>
          <div
            data-anim="settle"
            style={{ ["--d" as string]: "420ms" }}
            className="absolute top-[clamp(40px,5vw,72px)] right-[max(clamp(20px,4vw,40px),calc((100%-1240px)/2+40px))] hidden w-[clamp(260px,32vw,460px)] md:block"
          >
            <Frame src={heroPhoto?.url} alt={heroPhoto?.alt || "Room photo"} sizes="(min-width: 760px) 32vw, 1px" priority />
            {from != null && <Sticker size={104} tilt={-9} top="from" main={shortNaira(from)} className="absolute -top-[18px] -left-[18px]" />}
          </div>
          <div className="wrap pt-[clamp(28px,3vw,40px)]">
            <BookingBar
              current={branch.slug}
              branches={allRooms.map((b) => ({
                slug: b.slug,
                name: b.name,
                rooms: b.rooms.map((r) => ({ slug: r.slug, name: r.name })),
              }))}
            />
          </div>
        </section>

        {/* Rooms in a horizontal scroll with price stickers. */}
        {rooms.length > 0 && (
          <section aria-label="Rooms" className="pt-[clamp(72px,9vw,128px)] pb-[clamp(56px,7vw,96px)]">
            <div className="wrap flex flex-wrap items-end justify-between gap-6">
              <div>
                <Label>{NUMBER_WORDS[rooms.length] ?? rooms.length} kinds of room</Label>
                <h2 data-reveal="" className="font-headline text-section mt-2">
                  pick your room
                </h2>
              </div>
              <ArrowLink href="/rooms">Compare all rooms</ArrowLink>
            </div>
            <div className="no-scrollbar snap-gutter mt-9 snap-x snap-mandatory overflow-x-auto">
              <ul className="scroll-gutter m-0 flex w-max list-none gap-[clamp(16px,2vw,28px)] pt-5 pb-2">
                {rooms.map((r) => (
                  <li key={r.id} className="w-[clamp(270px,26vw,340px)] snap-start">
                    <Link href={`/rooms/${r.slug}`} className="group text-ink flex flex-col gap-3.5 no-underline">
                      <div className="relative">
                        <Frame src={r.images[0]?.url} alt={r.images[0]?.alt || r.name} sizes="(min-width: 760px) 26vw, 270px" />
                        <Sticker main={shortNaira(r.pricePerNight)} className="absolute -top-3.5 -right-2.5" />
                      </div>
                      <span className="font-display text-[clamp(22px,1.9vw,26px)] leading-none font-bold tracking-[-0.03em] lowercase">{r.name}</span>
                      <span className="text-slate text-[15px] leading-normal">{r.amenities.slice(0, 3).join(" · ")}</span>
                      <span className="text-teal text-[15px] font-semibold">
                        See room <span className="inline-block transition-transform duration-[180ms] group-hover:translate-x-1">→</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* Lights off: the one black block on the home page. */}
        {bar && (
          <section data-lights="" aria-label="The bar" className="theme-night bg-night py-[clamp(64px,8vw,120px)] text-white">
            <div className="wrap flex flex-wrap items-center gap-x-[clamp(40px,6vw,96px)] gap-y-10">
              <div className="flex flex-[1_1_360px] flex-col gap-5">
                <Label gold>the bar</Label>
                <h2 className="font-display text-gold m-0 text-[clamp(40px,6vw,88px)] leading-[0.92] font-extrabold tracking-[-0.055em]">
                  the bar opens at {bar.word}
                </h2>
                <div className="mt-2 flex flex-col gap-1">
                  <span className="font-display text-[clamp(26px,2.6vw,36px)] font-bold tracking-[-0.03em]">{bar.time} till late</span>
                  {branch.barIntro && (
                    <span className="text-night-muted text-base">{branch.barIntro.split(". ").slice(0, 2).join(". ").replace(/\.?$/, ".")}</span>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-3">
                  <ButtonLink href="/bar" variant="gold" size="lg">
                    See the menu
                  </ButtonLink>
                </div>
              </div>
              {barPhoto && (
                <div data-reveal="" className="flex-[1.4_1_420px]">
                  <Frame src={barPhoto.url} alt={barPhoto.alt} ratio="16/9" dark sizes="(min-width: 760px) 55vw, 100vw" />
                </div>
              )}
            </div>
          </section>
        )}

        {/* Offers as aqua blocks; the section slides up over the bar. */}
        {offers.length > 0 && (
          <section data-block="" aria-label="Offers" className="bg-white pt-[clamp(64px,8vw,120px)] pb-[clamp(40px,5vw,64px)]">
            <div className="wrap">
              <h2 data-reveal="" className="font-headline text-section mb-8">
                this month only
              </h2>
              <div className="flex flex-wrap gap-5">
                {offers.slice(0, 2).map((o, i) => (
                  <div
                    key={o.id}
                    data-reveal=""
                    className={`rounded-frame bg-aqua flex min-h-[300px] flex-col gap-5 p-[clamp(28px,3.5vw,48px)] ${i === 0 ? "flex-[1.6_1_420px]" : "flex-[1_1_300px]"}`}
                  >
                    <span className="self-start rounded-full bg-white px-3.5 py-1.5 text-[13px] font-semibold">{offerTag(o)}</span>
                    <h3 className={`font-headline m-0 ${i === 0 ? "text-[clamp(32px,3.6vw,52px)]" : "text-[clamp(28px,2.8vw,40px)]"}`}>{o.title}</h3>
                    <p className="m-0 max-w-[420px] text-[17px] leading-[1.6]">{o.description}</p>
                    {i === 0 ? (
                      <ButtonLink href={`/book?offer=${o.id}`} className="mt-auto self-start">
                        {o.ctaLabel || "Book this offer"}
                      </ButtonLink>
                    ) : (
                      <ButtonLink href="/offers" variant="secondary" className="mt-auto self-start">
                        All offers
                      </ButtonLink>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Gallery strip. */}
        {strip.length > 0 && (
          <section aria-label="Gallery" className="py-[clamp(40px,5vw,64px)]">
            <div className="wrap flex flex-wrap items-end justify-between gap-6">
              <h2 data-reveal="" className="font-headline text-section m-0">
                have a look
              </h2>
              <ArrowLink href="/gallery">Open the gallery</ArrowLink>
            </div>
            <div className="no-scrollbar mt-8 overflow-x-auto">
              <div className="scroll-gutter flex w-max items-end gap-4">
                {strip.map((g, i) => {
                  const tall = i % 2 === 0;
                  const ratio = ["3/2", "1/1", "4/5", "3/2", "4/5"][i] ?? "1/1";
                  return (
                    <div
                      key={g.id}
                      className={`rounded-frame bg-aqua-tint relative overflow-hidden ${tall ? "h-[clamp(220px,24vw,340px)]" : "h-[clamp(180px,18vw,260px)]"}`}
                      style={{ aspectRatio: ratio }}
                    >
                      <Image src={g.url} alt={g.alt} fill sizes="(min-width: 760px) 34vw, 70vw" className="object-cover" />
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Location preview. */}
        <section aria-label="Location" className="pt-[clamp(56px,7vw,96px)] pb-[clamp(72px,9vw,128px)]">
          <div className="wrap flex flex-wrap items-center gap-x-[clamp(40px,6vw,96px)] gap-y-10">
            <div className="flex flex-[1_1_340px] flex-col gap-4">
              <Label>look for the aqua building</Label>
              <h2 data-reveal="" className="font-headline text-section m-0">
                {shortAddress(branch)}
              </h2>
              <p className="text-slate m-0 max-w-[420px] text-[17px] leading-[1.6]">
                {[landmark && landmark.charAt(0).toUpperCase() + landmark.slice(1) + ".", branch.hours].filter(Boolean).join(" ")}
              </p>
              <div className="mt-2 flex flex-wrap gap-3">
                <ButtonLink href={`/locations/${branch.slug}`}>Get directions</ButtonLink>
                <ButtonA href={telHref(branch.phone)} variant="secondary">
                  Call the front desk
                </ButtonA>
              </div>
            </div>
            <div data-reveal="" className="flex-[1.2_1_380px]">
              {exterior ? <Frame src={exterior.url} alt={exterior.alt} ratio="3/2" sizes="(min-width: 760px) 50vw, 100vw" /> : <BuildingDrawing />}
            </div>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
