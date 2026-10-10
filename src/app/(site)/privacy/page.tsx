import type { Metadata } from "next";
import { SiteShell } from "@/components/site/site-shell";
import { getSettings } from "@/lib/settings";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "What De Classic Hotel collects when you send a reservation request, why, and how long we keep it.",
  alternates: { canonical: "/privacy" },
};

export default async function PrivacyPage() {
  const settings = await getSettings();
  const contact = settings.contactEmail || "the front desk";
  return (
    <SiteShell>
      <main className="mx-auto max-w-[720px] px-5 pt-[clamp(40px,6vw,72px)] pb-[clamp(72px,9vw,120px)]">
        <span className="text-teal mb-3 block text-sm font-semibold">privacy</span>
        <h1 className="font-display m-0 text-[clamp(44px,6vw,80px)] leading-[0.92] font-extrabold tracking-[-0.055em]">your details, kept short</h1>
        <div className="[&_h2]:font-display mt-10 flex flex-col gap-8 text-[17px] leading-[1.6] [&_h2]:m-0 [&_h2]:mb-2 [&_h2]:text-[28px] [&_h2]:font-bold [&_h2]:tracking-[-0.03em] [&_p]:m-0 [&_ul]:m-0 [&_ul]:pl-5">
          <section>
            <h2>what we collect</h2>
            <p>
              When you send a reservation request we ask for your name, phone number, the dates and room you want, and how many guests. Email and a
              note are optional. We don&apos;t ask for ID, card details or an account, and we take no payment on this website.
            </p>
          </section>
          <section>
            <h2>why</h2>
            <p>
              We use these details only to confirm your reservation by phone or WhatsApp and to prepare your room. We don&apos;t sell them, share them
              for marketing, or add you to a mailing list.
            </p>
          </section>
          <section>
            <h2>who sees them</h2>
            <p>
              Hotel staff at the branch you booked, through a password-protected admin. Our website host, database and email providers process the
              data on our behalf to run the site.
            </p>
          </section>
          <section>
            <h2>how long we keep them</h2>
            <p>We keep reservation records for up to two years for accounting and to help with returning guests, then delete them.</p>
          </section>
          <section>
            <h2>your rights</h2>
            <p>
              Under the Nigeria Data Protection Act 2023 you can ask to see, correct or delete the details we hold about you. Contact {contact} and
              we&apos;ll respond within 30 days.
            </p>
          </section>
          <section>
            <h2>cookies</h2>
            <p>
              The public site sets one small cookie to remember which branch you picked. Staff sign-in uses a session cookie. There are no advertising
              or tracking cookies.
            </p>
          </section>
        </div>
      </main>
    </SiteShell>
  );
}
