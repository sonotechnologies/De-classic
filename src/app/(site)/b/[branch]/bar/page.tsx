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
      <main className="theme-night bg-night [&_a:not([class*=bg-])]:text-gold text-white">
        <section className="wrap pt-[clamp(48px,7vw,104px)]">
          <span data-anim="rise" style={{ ["--d" as string]: "100ms" }} className="text-gold mb-4 block text-sm font-semibold">
            the bar · ground floor
          </span>
          <h1 className="font-display text-gold m-0 text-[clamp(56px,11vw,160px)] leading-[0.88] font-extrabold tracking-[-0.06em]">
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
              <div key={h.days} className="border-night-line flex items-baseline justify-between gap-4 border-b py-3.5">
                <span className="text-night-muted text-base">{h.days}</span>
                <span className="font-display text-[clamp(24px,2.4vw,34px)] font-bold tracking-[-0.03em]">{h.time}</span>
              </div>
            ))}
            {branch.barIntro && <p className="text-night-muted mt-5 mb-0 text-base leading-[1.6]">{branch.barIntro}</p>}
          </div>
        </section>

        <section aria-label="Menu" className="wrap py-[clamp(72px,9vw,128px)]">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-headline text-gold m-0 text-[clamp(40px,5vw,72px)]">the menu</h2>
            {menuIsSample && <span className="text-night-muted text-sm">Sample menu and prices</span>}
          </div>
          {menu.length === 0 ? (
            <p className="text-night-muted m-0 text-lg">The menu is being updated. Ask at the bar for tonight&apos;s drinks.</p>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-x-[clamp(40px,6vw,96px)] gap-y-12">
              {menu.map((c) => (
                <div key={c.id} data-reveal="">
                  <h3 className="font-display text-gold mt-0 mb-2 text-[28px] font-bold tracking-[-0.03em] lowercase">{c.name}</h3>
                  {c.items.map((i) => (
                    <div key={i.id} className="border-night-line flex justify-between gap-4 border-b py-[13px] text-[17px]">
                      <span>
                        {i.name}
                        {i.description && <span className="text-night-muted block text-sm">{i.description}</span>}
                      </span>
                      <span className="font-semibold whitespace-nowrap">{formatNaira(i.price)}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
          <div className="border-gold mt-16 flex flex-wrap items-center justify-between gap-x-8 gap-y-5 border-t-[1.5px] pt-8">
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
