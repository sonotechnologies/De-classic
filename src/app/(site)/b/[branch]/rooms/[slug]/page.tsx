import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/site/site-shell";
import { Frame } from "@/components/ui/bits";
import { ButtonLink } from "@/components/ui/button";
import { formatNaira, friendlyTime } from "@/lib/format";
import { getPublishedBranches, getVisibleRoom, getVisibleRooms, resolveBranch } from "@/lib/site-data";

export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const branches = await getPublishedBranches();
    const out: { branch: string; slug: string }[] = [];
    for (const [i, b] of branches.entries()) {
      for (const r of await getVisibleRooms(b.id)) {
        out.push({ branch: b.slug, slug: r.slug });
        if (i === 0) out.push({ branch: "_", slug: r.slug });
      }
    }
    return out;
  } catch {
    return [];
  }
}

async function load(params: PageProps<"/b/[branch]/rooms/[slug]">["params"]) {
  const { branch: b, slug } = await params;
  const { branch } = await resolveBranch(b);
  if (!branch) return null;
  const room = await getVisibleRoom(branch.id, slug);
  return room ? { branch, room } : null;
}

export async function generateMetadata({ params }: PageProps<"/b/[branch]/rooms/[slug]">): Promise<Metadata> {
  const data = await load(params);
  if (!data) return { title: "Room not found" };
  const { room } = data;
  return {
    title: `${room.name}, ${formatNaira(room.pricePerNight)} a night`,
    description: room.description.slice(0, 155),
    alternates: { canonical: `/rooms/${room.slug}` },
    openGraph: room.images[0] ? { images: [{ url: room.images[0].url, alt: room.images[0].alt }] } : undefined,
  };
}

export default async function RoomDetailPage({ params }: PageProps<"/b/[branch]/rooms/[slug]">) {
  const data = await load(params);
  if (!data) notFound();
  const { branch, room } = data;
  const requestHref = `/book?branch=${branch.slug}&room=${room.slug}`;
  const name = room.name.toLowerCase();

  return (
    <SiteShell
      branchSlug={branch.slug}
      sample={branch.isSample || room.isSample}
      sticky={{
        label: name,
        price: `${formatNaira(room.pricePerNight)} / night`,
        href: requestHref,
        cta: "Request this room",
      }}
    >
      <main>
        <section data-anim="wipe" className="bg-aqua pt-[clamp(28px,4vw,56px)] pb-[clamp(120px,14vw,200px)]">
          <div className="wrap">
            <Link href="/rooms" className="text-teal inline-flex gap-2 text-[15px] font-semibold no-underline">
              ← All rooms
            </Link>
            <div className="mt-5 flex flex-wrap items-end justify-between gap-x-12 gap-y-4">
              <h1
                data-anim="rise"
                style={{ ["--d" as string]: "200ms" }}
                className="font-display m-0 text-[clamp(52px,9vw,128px)] leading-[0.9] font-extrabold tracking-[-0.06em]"
              >
                {name}
              </h1>
              <span data-anim="rise" style={{ ["--d" as string]: "280ms" }}>
                <span className="font-display text-[clamp(30px,3vw,44px)] font-extrabold tracking-[-0.04em]">{formatNaira(room.pricePerNight)}</span>{" "}
                <span className="text-[15px]">per night</span>
              </span>
            </div>
          </div>
        </section>

        <section aria-label="Photos" className="-mt-[clamp(90px,11vw,180px)]">
          <div className="no-scrollbar snap-gutter snap-x snap-mandatory overflow-x-auto">
            <ul className="scroll-gutter m-0 flex w-max list-none gap-4 p-0">
              {room.images.map((img, i) => (
                <li
                  key={img.id}
                  data-anim="settle"
                  style={{ ["--d" as string]: `${300 + i * 60}ms` }}
                  className="w-[clamp(300px,52vw,760px)] snap-start"
                >
                  <Frame src={img.url} alt={img.alt || room.name} ratio="3/2" sizes="(min-width: 760px) 52vw, 300px" priority={i === 0} />
                </li>
              ))}
              {room.images.length === 0 && (
                <li className="w-[clamp(300px,52vw,760px)]">
                  <Frame alt="" ratio="3/2" sizes="1px" />
                </li>
              )}
            </ul>
          </div>
          {room.images.length > 1 && (
            <div className="wrap text-slate mt-3 text-[13px]">
              Swipe for more · {room.images.length} photos
              {room.isSample ? ", stand-ins" : ""}
            </div>
          )}
        </section>

        <section className="wrap flex flex-wrap gap-x-[clamp(40px,7vw,120px)] gap-y-12 pt-[clamp(48px,6vw,88px)] pb-[clamp(72px,9vw,120px)]">
          <div className="flex flex-[1_1_340px] flex-col gap-5">
            {room.tagline && <h2 className="font-headline m-0 text-[clamp(34px,4vw,56px)]">{room.tagline}</h2>}
            <p className="m-0 max-w-[480px] text-[17px] leading-[1.6] text-pretty">{room.description}</p>
            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2.5 text-base">
              <dt className="text-slate">Check in</dt>
              <dd className="m-0 font-semibold">From {friendlyTime(branch.checkInTime)}</dd>
              <dt className="text-slate">Check out</dt>
              <dd className="m-0 font-semibold">By {friendlyTime(branch.checkOutTime)}</dd>
              <dt className="text-slate">Sleeps</dt>
              <dd className="m-0 font-semibold">
                {room.capacity} adult{room.capacity === 1 ? "" : "s"}
              </dd>
              {branch.allowsShortStay && room.shortStayPrice != null && (
                <>
                  <dt className="text-slate">Short stay</dt>
                  <dd className="m-0 font-semibold">{formatNaira(room.shortStayPrice)}</dd>
                </>
              )}
            </dl>
          </div>
          {room.amenities.length > 0 && (
            <div className="flex-[1_1_340px]">
              <span className="text-teal text-sm font-semibold">in the room</span>
              <ul className="m-0 mt-4 grid list-none grid-cols-2 gap-x-6 p-0">
                {room.amenities.map((a) => (
                  <li key={a} className="border-line border-b py-3.5 text-base">
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <div className="sticky bottom-5 z-[80] mx-auto mb-10 hidden max-w-[1240px] px-10 md:block">
          <div className="border-ink flex items-center justify-between gap-6 rounded-full border-[1.5px] bg-white py-2.5 pr-2.5 pl-8">
            <span className="flex items-baseline gap-3">
              <span className="font-display text-[22px] font-bold tracking-[-0.03em]">{name}</span>
              <span className="text-slate text-[15px]">{formatNaira(room.pricePerNight)} per night</span>
            </span>
            <ButtonLink href={requestHref} size="lg" className="px-7">
              Request this room
            </ButtonLink>
          </div>
        </div>
      </main>
    </SiteShell>
  );
}
