import type { ReactNode } from "react";
import type { Branch } from "@/db/schema";
import { formatNaira } from "@/lib/format";
import { displayInternational, telHref } from "@/lib/phone";
import { getSettings } from "@/lib/settings";
import { getVisibleRooms, lowestPrice, resolveBranch } from "@/lib/site-data";
import { SiteFooter, StickyBookBar, WhatsAppButton } from "./footer";
import { SiteHeader } from "./header";
import { Motion } from "./motion";

type Sticky = { label: string; price: string; href: string; cta: string };

/**
 * Header, footer, floating WhatsApp button and the sticky mobile booking bar around every public page.
 * `branchSlug` is the branch from the URL; anything unknown falls back to the default branch.
 */
export async function SiteShell({
  branchSlug,
  children,
  sticky = "default",
  sample = false,
  footer = true,
}: {
  branchSlug?: string;
  children: ReactNode;
  /** "default" shows "rooms from ₦…", false hides it, or pass custom content. */
  sticky?: "default" | false | Sticky;
  /** Page shows placeholder content, so the footer carries the stand-in note. */
  sample?: boolean;
  footer?: boolean;
}) {
  const [{ branch, branches }, settings] = await Promise.all([resolveBranch(branchSlug), getSettings()]);
  const phone = branch?.phone || settings.contactPhone;

  let bar: Sticky | null = null;
  if (sticky === "default" && branch) {
    const from = lowestPrice(await getVisibleRooms(branch.id));
    if (from != null) bar = { label: "rooms from", price: formatNaira(from), href: "/book", cta: "Book now" };
  } else if (sticky && sticky !== "default") {
    bar = sticky;
  }

  return (
    <>
      <SiteHeader
        branches={branches.map((b) => ({ slug: b.slug, name: b.name }))}
        current={branch?.slug ?? null}
        phoneHref={telHref(phone)}
        phoneLabel={displayInternational(phone)}
      />
      {children}
      {footer && <SiteFooter branch={branch} settings={settings} sampleNote={sample || isSampleBranch(branch) || settings.contactIsSample} />}
      <WhatsAppButton number={branch?.whatsapp || settings.contactWhatsapp} />
      {bar && <StickyBookBar {...bar} />}
      {/* Last, so its effect runs after the page above has hydrated. */}
      <Motion />
    </>
  );
}

function isSampleBranch(branch: Branch | null) {
  return !!branch?.isSample;
}
