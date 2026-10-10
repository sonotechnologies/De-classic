import type { Branch, GalleryImage } from "@/db/schema";
import { BuildingDrawing, Frame } from "@/components/ui/bits";
import { ButtonA } from "@/components/ui/button";
import { addressLines } from "@/lib/copy";
import { displayInternational, telHref, whatsappHref } from "@/lib/phone";

export function mapEmbedSrc(branch: Branch) {
  return branch.mapEmbedUrl || `https://www.google.com/maps?q=${encodeURIComponent(branch.address)}&output=embed`;
}

export function directionsHref(branch: Branch) {
  return branch.mapUrl || `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(branch.address)}`;
}

/** Aqua page with the address set very large, a rounded map over the paint line, landmarks and contact buttons. */
export function LocationDetail({ branch, exterior }: { branch: Branch; exterior?: GalleryImage }) {
  const [line1, line2] = addressLines(branch);
  return (
    <main>
      <section data-anim="wipe" className="bg-aqua pt-[clamp(40px,6vw,80px)] pb-[clamp(180px,20vw,300px)]">
        <div className="wrap">
          <span data-anim="rise" style={{ ["--d" as string]: "120ms" }} className="text-teal mb-4 block text-sm font-semibold">
            look for the aqua building
          </span>
          <h1 className="font-display m-0 text-[clamp(48px,8.6vw,124px)] leading-[0.9] font-extrabold tracking-[-0.055em]">
            <span data-anim="rise" style={{ ["--d" as string]: "180ms" }} className="block">
              {line1}
            </span>
            <span data-anim="rise" style={{ ["--d" as string]: "240ms" }} className="block">
              {line2}
            </span>
          </h1>
          <p className="mt-5 mb-0 text-[17px] leading-[1.6]">{branch.address}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonA href={directionsHref(branch)} target="_blank" rel="noopener" size="lg">
              Get directions
            </ButtonA>
            <ButtonA href={telHref(branch.phone)} variant="secondary" size="lg">
              Call {displayInternational(branch.phone)}
            </ButtonA>
            <ButtonA href={whatsappHref(branch.whatsapp)} variant="secondary" size="lg">
              WhatsApp
            </ButtonA>
          </div>
        </div>
      </section>

      <section className="wrap -mt-[clamp(140px,16vw,240px)]">
        <div
          data-anim="settle"
          style={{ ["--d" as string]: "320ms" }}
          className="rounded-frame border-line bg-aqua-tint relative min-h-[280px] overflow-hidden border"
        >
          <div className="aspect-[21/9] min-h-[280px] w-full" />
          <iframe
            src={mapEmbedSrc(branch)}
            title={`Map showing De Classic Hotel, ${branch.name}`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0 size-full border-0"
          />
        </div>
      </section>

      <section className="wrap flex flex-wrap gap-x-[clamp(40px,7vw,120px)] gap-y-12 pt-[clamp(56px,7vw,96px)] pb-[clamp(72px,9vw,128px)]">
        <div className="flex-[1_1_320px]">
          {branch.landmarks.length > 0 && (
            <>
              <h2 className="font-headline mt-0 mb-5 text-[clamp(34px,4vw,56px)]">close to</h2>
              {branch.landmarks.map((n) => (
                <div key={n.place} className="border-line flex justify-between gap-4 border-b py-4 text-[17px]">
                  <span>{n.place}</span>
                  <span className="text-slate whitespace-nowrap">{n.time}</span>
                </div>
              ))}
            </>
          )}
          {branch.hours && <p className="text-slate mt-5 mb-0 text-[15px] leading-[1.6]">{branch.hours}</p>}
        </div>
        <div data-reveal="" className="flex flex-[1.2_1_360px] flex-col gap-3">
          {exterior ? (
            <Frame src={exterior.url} alt={exterior.alt} ratio="3/2" sizes="(min-width: 760px) 50vw, 100vw" />
          ) : (
            <>
              <BuildingDrawing />
              <span className="text-slate text-[13px]">A drawing of the building until a daylight photo is taken.</span>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
