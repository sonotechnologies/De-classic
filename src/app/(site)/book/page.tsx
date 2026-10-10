import type { Metadata } from "next";
import { cookies } from "next/headers";
import { BookForm, type BookBranch } from "@/components/site/book-form";
import { SiteShell } from "@/components/site/site-shell";
import { ButtonA } from "@/components/ui/button";
import { BRANCH_COOKIE_NAME } from "@/lib/branch-cookie";
import { friendlyTime, isIsoDate } from "@/lib/format";
import { displayInternational, telHref, whatsappHref } from "@/lib/phone";
import { getSettings } from "@/lib/settings";
import { getActiveOffers, getPublishedBranches, getVisibleRooms } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Book a room",
  description: "Send a reservation request in under a minute. No account and nothing to pay online. The front desk confirms by call or WhatsApp.",
  alternates: { canonical: "/book" },
};

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function BookPage({ searchParams }: PageProps<"/book">) {
  const sp = await searchParams;
  const [all, settings, jar] = await Promise.all([getPublishedBranches(), getSettings(), cookies()]);

  const branches: BookBranch[] = await Promise.all(
    all.map(async (b) => {
      const [rooms, offers] = await Promise.all([getVisibleRooms(b.id), getActiveOffers(b.id)]);
      return {
        slug: b.slug,
        name: b.name,
        allowsShortStay: b.allowsShortStay,
        whatsapp: b.whatsapp,
        rooms: rooms.map((r) => ({
          slug: r.slug,
          name: r.name,
          price: r.pricePerNight,
          shortPrice: r.shortStayPrice,
          capacity: r.capacity,
        })),
        offers: offers.map((o) => ({ id: o.id, title: o.title })),
      };
    }),
  );

  // Pre-fill from the link the guest came from: a room page, an offer, or the home booking bar.
  const wanted = one(sp.branch) || jar.get(BRANCH_COOKIE_NAME)?.value || "";
  let branch = branches.find((b) => b.slug === wanted) ?? branches[0];
  const offerId = one(sp.offer);
  const offerBranch = offerId ? branches.find((b) => b.offers.some((o) => o.id === offerId)) : undefined;
  if (offerBranch) branch = offerBranch;
  const roomSlug = one(sp.room);
  const checkIn = one(sp.checkIn);
  const checkOut = one(sp.checkOut);
  const branchRow = all.find((b) => b.slug === branch?.slug) ?? all[0];
  const phone = branchRow?.phone || settings.contactPhone;
  const whatsapp = branchRow?.whatsapp || settings.contactWhatsapp;
  const rules = settings.houseRules
    .split("\n")
    .map((r) => r.trim())
    .filter(Boolean);

  return (
    <SiteShell branchSlug={branch?.slug} sticky={false}>
      <main className="mx-auto flex max-w-[640px] flex-col gap-12 px-5 pt-[clamp(40px,6vw,72px)] pb-[clamp(72px,9vw,120px)]">
        {settings.requestsPaused || !branch ? (
          <div className="rounded-frame bg-aqua flex flex-col items-start gap-5 p-[clamp(28px,5vw,56px)]">
            <span className="text-teal text-sm font-semibold">book</span>
            <h1 className="font-display m-0 text-[clamp(44px,6vw,80px)] leading-[0.92] font-extrabold tracking-[-0.055em]">call to book</h1>
            <p className="m-0 max-w-[440px] text-[17px] leading-[1.6]">
              Online requests are paused for now. The front desk can book you in straight away by phone or WhatsApp.
            </p>
            <div className="flex flex-wrap gap-3">
              <ButtonA href={telHref(phone)} size="lg">
                Call {displayInternational(phone)}
              </ButtonA>
              <ButtonA href={whatsappHref(whatsapp, "Hi De Classic, I'd like to book a room.")} variant="secondary" size="lg">
                WhatsApp
              </ButtonA>
            </div>
          </div>
        ) : (
          <BookForm
            branches={branches}
            initial={{
              branch: branch.slug,
              room: branch.rooms.some((r) => r.slug === roomSlug) ? roomSlug : (branch.rooms[0]?.slug ?? ""),
              checkIn: isIsoDate(checkIn) ? checkIn : "",
              checkOut: isIsoDate(checkOut) ? checkOut : "",
              offer: branch.offers.some((o) => o.id === offerId) ? offerId : "",
            }}
          />
        )}

        <section aria-labelledby="house-rules" className="border-line flex flex-col gap-3 border-t pt-8">
          <h2 id="house-rules" className="font-display m-0 text-[28px] font-bold tracking-[-0.03em]">
            house rules
          </h2>
          <ul className="m-0 flex list-none flex-col p-0 text-base leading-normal">
            {branchRow && (
              <li className="border-line border-b py-3">
                Check in from {friendlyTime(branchRow.checkInTime)}, check out by {friendlyTime(branchRow.checkOutTime)}.
              </li>
            )}
            {rules.map((r) => (
              <li key={r} className="border-line border-b py-3">
                {r}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </SiteShell>
  );
}
