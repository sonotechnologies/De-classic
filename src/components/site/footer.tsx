import Link from "next/link";
import type { Branch } from "@/db/schema";
import { displayInternational, telHref, whatsappHref } from "@/lib/phone";
import type { SiteSettings } from "@/lib/settings";

const NAV = [
  ["Rooms", "/rooms"],
  ["The bar", "/bar"],
  ["Gallery", "/gallery"],
  ["Offers", "/offers"],
  ["Locations", "/locations"],
  ["Privacy", "/privacy"],
] as const;

export function SiteFooter({ branch, settings, sampleNote }: { branch: Branch | null; settings: SiteSettings; sampleNote: boolean }) {
  const phone = branch?.phone || settings.contactPhone;
  const whatsapp = branch?.whatsapp || settings.contactWhatsapp;
  const socials = (
    [
      ["Instagram", settings.instagram],
      ["Facebook", settings.facebook],
      ["TikTok", settings.tiktok],
      ["X", settings.x],
    ] as const
  ).filter(([, url]) => url);

  return (
    <footer data-block="" className="site-footer bg-aqua text-ink overflow-hidden pt-[72px] pb-10">
      <div className="wrap">
        <div className="flex flex-wrap gap-x-16 gap-y-10">
          <div className="flex flex-[1_1_260px] flex-col gap-2">
            <span className="text-teal text-sm font-semibold">find us</span>
            {branch ? (
              <span className="text-lg leading-normal">{branch.address}</span>
            ) : (
              <span className="text-lg leading-normal">Ikorodu, Lagos</span>
            )}
            <Link
              href={branch ? `/locations/${branch.slug}` : "/locations"}
              className="text-teal inline-flex gap-2 font-semibold no-underline transition-[gap] duration-[180ms] hover:gap-3"
            >
              Get directions <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="flex flex-[1_1_220px] flex-col gap-2">
            <span className="text-teal text-sm font-semibold">talk to us</span>
            <a href={telHref(phone)} className="text-ink text-lg font-semibold no-underline">
              {displayInternational(phone)}
            </a>
            <a href={whatsappHref(whatsapp)} className="text-ink text-lg font-semibold no-underline">
              WhatsApp us
            </a>
            {socials.length > 0 && (
              <span className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-base">
                {socials.map(([label, url]) => (
                  <a key={label} href={url} rel="noopener" className="text-ink hover:text-teal no-underline">
                    {label}
                  </a>
                ))}
              </span>
            )}
          </div>
          <nav aria-label="Footer" className="grid flex-[1_1_220px] grid-cols-2 content-start gap-x-6 gap-y-2">
            {NAV.map(([label, href]) => (
              <Link key={href} href={href} className="text-ink hover:text-teal text-base no-underline">
                {label}
              </Link>
            ))}
            <Link href="/book" className="text-ink hover:text-teal text-base font-semibold no-underline">
              Book now
            </Link>
          </nav>
        </div>
        <div aria-hidden="true" className="font-display mt-16 text-[15.4vw] leading-[0.8] font-extrabold tracking-[-0.06em] whitespace-nowrap">
          de classic
        </div>
        <div className="border-ink mt-7 flex flex-wrap justify-between gap-2 border-t-[1.5px] pt-4 text-[13px]">
          <span>
            © {new Date().getFullYear()} {settings.hotelName}, Ikorodu
          </span>
          {sampleNote && <span>Photos are stand-ins, not De Classic Hotel. Prices and details are samples.</span>}
        </div>
      </div>
    </footer>
  );
}

export function WhatsAppButton({ number }: { number: string }) {
  return (
    <a
      href={whatsappHref(number)}
      aria-label="Chat on WhatsApp"
      className="wa-float bg-ink hover:bg-teal fixed right-5 z-[90] flex size-14 items-center justify-center rounded-full transition-colors duration-[180ms]"
    >
      <svg
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
      </svg>
    </a>
  );
}

/** Sticky white bar on phones with the price and one "Book now" action. Hidden on desktop. */
export function StickyBookBar({ label, price, href, cta }: { label: string; price: string; href: string; cta: string }) {
  return (
    <div
      data-sticky-bar=""
      className="border-line fixed inset-x-0 bottom-0 z-[95] flex items-center justify-between gap-3 border-t bg-white px-5 py-3 md:hidden"
    >
      <div className="flex flex-col leading-[1.1]">
        <span className="text-teal text-[13px] font-semibold">{label}</span>
        <span className="font-display text-[22px] font-bold tracking-[-0.03em]">{price}</span>
      </div>
      <Link
        href={href}
        className="bg-ink hover:bg-teal inline-flex h-12 items-center rounded-full px-6 text-base font-semibold text-white no-underline hover:text-white"
      >
        {cta}
      </Link>
    </div>
  );
}
