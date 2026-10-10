import { SiteShell } from "@/components/site/site-shell";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <SiteShell>
        <main>
          <section data-anim="wipe" className="bg-aqua py-[clamp(56px,9vw,140px)]">
            <div className="wrap flex flex-col items-start gap-6">
              <span data-anim="rise" style={{ ["--d" as string]: "160ms" }} className="text-sm font-semibold text-teal">
                page not found · 404
              </span>
              <h1
                data-anim="rise"
                style={{ ["--d" as string]: "220ms" }}
                className="m-0 max-w-[12ch] font-display text-[clamp(52px,9vw,128px)] font-extrabold leading-[0.9] tracking-[-0.055em]"
              >
                this room doesn&apos;t exist
              </h1>
              <p className="m-0 max-w-[440px] text-lg leading-[1.6]">The link may be old. The real rooms are one tap away.</p>
              <ButtonLink href="/rooms" size="xl">
                See the rooms
              </ButtonLink>
            </div>
          </section>
        </main>
    </SiteShell>
  );
}
