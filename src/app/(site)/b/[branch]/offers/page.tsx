import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/site/site-shell";
import { ButtonLink } from "@/components/ui/button";
import { offerTag } from "@/lib/copy";
import { longDate } from "@/lib/format";
import { getActiveOffers, hasSample, resolveBranch } from "@/lib/site-data";
import { branchParams } from "@/lib/static-params";

export const revalidate = 3600;
export const generateStaticParams = branchParams;

export const metadata: Metadata = {
  title: "Offers and deals",
  description: "Current room deals and bar offers at De Classic Hotel, Ikorodu. Book before they end.",
  alternates: { canonical: "/offers" },
};

export default async function OffersPage({ params }: PageProps<"/b/[branch]/offers">) {
  const { branch } = await resolveBranch((await params).branch);
  if (!branch) notFound();
  const offers = await getActiveOffers(branch.id);

  return (
    <SiteShell branchSlug={branch.slug} sample={branch.isSample || hasSample(offers)}>
      <main>
        <section className="wrap pt-[clamp(40px,6vw,80px)] pb-[clamp(32px,4vw,48px)]">
          <span data-anim="rise" style={{ ["--d" as string]: "100ms" }} className="text-teal mb-4 block text-sm font-semibold">
            offers
          </span>
          <h1
            data-anim="rise"
            style={{ ["--d" as string]: "160ms" }}
            className="font-display m-0 text-[clamp(48px,8vw,116px)] leading-[0.9] font-extrabold tracking-[-0.055em]"
          >
            deals, while
            <br />
            they last
          </h1>
        </section>

        {offers.length > 0 ? (
          <section className="wrap flex flex-col gap-5 pb-[clamp(72px,9vw,128px)]">
            {offers.map((o) => (
              <article
                key={o.id}
                data-reveal=""
                className="rounded-frame bg-aqua flex flex-wrap items-end gap-x-[clamp(32px,6vw,96px)] gap-y-6 p-[clamp(28px,4vw,56px)]"
              >
                <div className="flex flex-[1.4_1_320px] flex-col items-start gap-5">
                  <span className="rounded-full bg-white px-3.5 py-1.5 text-[13px] font-semibold">{offerTag(o)}</span>
                  <h2 className="font-display m-0 text-[clamp(36px,5vw,72px)] leading-[0.92] font-extrabold tracking-[-0.055em]">{o.title}</h2>
                </div>
                <div className="flex flex-[1_1_280px] flex-col items-start gap-5">
                  <p className="m-0 text-[17px] leading-[1.6]">{o.description}</p>
                  {(o.terms || o.endsOn) && (
                    <p className="text-teal m-0 text-sm leading-normal">
                      {o.endsOn ? `Book by ${longDate(o.endsOn)}. ` : ""}
                      {o.terms}
                    </p>
                  )}
                  <ButtonLink href={`/book?branch=${branch.slug}&offer=${o.id}`} size="lg">
                    {o.ctaLabel || "Book this offer"}
                  </ButtonLink>
                </div>
              </article>
            ))}
          </section>
        ) : (
          <section className="wrap pb-[clamp(72px,9vw,128px)]">
            <div className="rounded-frame bg-aqua flex flex-col items-start gap-5 p-[clamp(32px,5vw,72px)]">
              <h2 className="font-display m-0 text-[clamp(36px,5vw,72px)] leading-[0.92] font-extrabold tracking-[-0.055em]">no deals right now</h2>
              <p className="m-0 max-w-[440px] text-[17px] leading-[1.6]">
                New offers usually go up at the start of the month. The rooms are still good value in the meantime.
              </p>
              <ButtonLink href="/rooms" size="lg">
                See the rooms
              </ButtonLink>
            </div>
          </section>
        )}
      </main>
    </SiteShell>
  );
}
