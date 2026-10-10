import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/site/site-shell";
import { Frame, Label } from "@/components/ui/bits";
import { ButtonLink } from "@/components/ui/button";
import { formatNaira } from "@/lib/format";
import { getGallery, getMenu, resolveBranch } from "@/lib/site-data";
import { branchParams } from "@/lib/static-params";

export const revalidate = 3600;
export const generateStaticParams = branchParams;

export async function generateMetadata({ params }: PageProps<"/b/[branch]/bar">): Promise<Metadata> {
  const { branch } = await resolveBranch((await params).branch);
  return {
    title: "The bar · menu and opening hours",
    description: `Cocktails, cold beer, spirits and small chops at the De Classic bar${branch ? ` in ${branch.area || branch.name}` : ""}. Opening hours and the full drinks menu with prices.`,
    alternates: { canonical: "/bar" },
  };
}

export default async function BarPage({ params }: PageProps<"/b/[branch]/bar">) {
  const { branch } = await resolveBranch((await params).branch);
  if (!branch) notFound();
  const [menu, gallery] = await Promise.all([getMenu(branch.id), getGallery(branch.id)]);
  const photo = gallery.find((g) => g.tag === "bar");
  const menuIsSample = menu.some((c) => c.items.some((i) => i.isSample));

  return (
    <SiteShell branchSlug={branch.slug} sample={branch.isSample || menuIsSample}>
      <main className="theme-night bg-night text-white [&_a:not([class*=bg-])]:text-gold">
        <section className="wrap pt-[clamp(48px,7vw,104px)]">
          <span data-anim="rise" style={{ ["--d" as string]: "100ms" }} className="mb-4 block text-sm font-semibold text-gold">
            the bar · ground floor
          </span>
          <h1 className="m-0 font-display text-[clamp(56px,11vw,160px)] font-extrabold leading-[0.88] tracking-[-0.06em] text-gold">
            <span data-anim="rise" style={{ ["--d" as string]: "160ms" }} className="block">
              lights off,
            </span>
            <span data-anim="rise" style={{ ["--d" as string]: "220ms" }} className="block">
              glasses up
            </span>
          </h1>
        </section>

        <section className="wrap flex flex-wrap items-end gap-x-[clamp(40px,6vw,96px)] gap-y-10 pt-[clamp(40px,5vw,72px)]">
          {photo && (
            <div data-anim="settle" style={{ ["--d" as string]: "300ms" }} className="flex-[1.5_1_420px]">
              <Frame src={photo.url} alt={photo.alt} ratio="16/9" dark priority sizes="(min-width: 760px) 58vw, 100vw" />
            </div>
          )}
          <div className="flex flex-[1_1_300px] flex-col">
            <Label gold className="mb-2">
              opening hours
            </Label>
            {branch.barHours.map((h) => (
              <div key={h.days} className="flex items-baseline justify-between gap-4 border-b border-night-line py-3.5">
                <span className="text-base text-night-muted">{h.days}</span>
                <span className="font-display text-[clamp(24px,2.4vw,34px)] font-bold tracking-[-0.03em]">{h.time}</span>
              </div>
            ))}
            {branch.barIntro && <p className="mb-0 mt-5 text-base leading-[1.6] text-night-muted">{branch.barIntro}</p>}
          </div>
        </section>

        <section aria-label="Menu" className="wrap py-[clamp(72px,9vw,128px)]">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <h2 className="m-0 font-headline text-[clamp(40px,5vw,72px)] text-gold">the menu</h2>
            {menuIsSample && <span className="text-sm text-night-muted">Sample menu and prices</span>}
          </div>
          {menu.length === 0 ? (
            <p className="m-0 text-lg text-night-muted">The menu is being updated. Ask at the bar for tonight&apos;s drinks.</p>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-x-[clamp(40px,6vw,96px)] gap-y-12">
              {menu.map((c) => (
                <div key={c.id} data-reveal="">
                  <h3 className="mb-2 mt-0 font-display text-[28px] font-bold lowercase tracking-[-0.03em] text-gold">{c.name}</h3>
                  {c.items.map((i) => (
                    <div key={i.id} className="flex justify-between gap-4 border-b border-night-line py-[13px] text-[17px]">
                      <span>
                        {i.name}
                        {i.description && <span className="block text-sm text-night-muted">{i.description}</span>}
                      </span>
                      <span className="whitespace-nowrap font-semibold">{formatNaira(i.price)}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
          <div className="mt-16 flex flex-wrap items-center justify-between gap-x-8 gap-y-5 border-t-[1.5px] border-gold pt-8">
            <span className="font-display text-[clamp(26px,3vw,40px)] font-bold tracking-[-0.04em]">stay the night, skip the drive home</span>
            <ButtonLink href="/book" variant="gold" size="xl" className="px-[30px]">
              Book a room
            </ButtonLink>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
