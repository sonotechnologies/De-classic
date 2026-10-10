import type { Metadata } from "next";
import { RequestSent } from "@/components/site/request-sent";
import { SiteShell } from "@/components/site/site-shell";
import { getSettings } from "@/lib/settings";
import { getPublishedBranches } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Request sent",
  robots: { index: false, follow: false },
};

export default async function RequestSentPage({ searchParams }: PageProps<"/book/sent">) {
  const ref = (await searchParams).ref;
  const reference = typeof ref === "string" && /^DC-\d{4,5}$/.test(ref) ? ref : "";
  const [branches, settings] = await Promise.all([getPublishedBranches(), getSettings()]);
  return (
    <div className="flex min-h-svh flex-col">
      <SiteShell footer={false} sticky={false}>
        <RequestSent reference={reference} fallbackWhatsapp={branches[0]?.whatsapp || settings.contactWhatsapp} />
      </SiteShell>
    </div>
  );
}
