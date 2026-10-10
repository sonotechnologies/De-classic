"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { whatsappHref } from "@/lib/phone";
import { LAST_REQUEST_KEY, type RequestSummary } from "@/lib/whatsapp-message";

/** Full aqua confirmation: the reference code huge in ink, a summary and the WhatsApp handoff. */
export function RequestSent({ reference, fallbackWhatsapp }: { reference: string; fallbackWhatsapp: string }) {
  const [s, setS] = useState<RequestSummary | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(LAST_REQUEST_KEY);
      const parsed = raw ? (JSON.parse(raw) as RequestSummary) : null;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- read once from session storage after hydration
      if (parsed && (!reference || parsed.reference === reference)) setS(parsed);
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, [reference]);

  const ref = s?.reference ?? reference;
  const first = s?.name.split(" ")[0];
  const waText =
    s?.whatsappMessage ?? (ref ? `Hi De Classic, my reservation reference is ${ref}.` : "Hi De Classic, I just sent a reservation request.");
  const contactLine =
    s?.contactMethod === "call"
      ? "The front desk will call you shortly to confirm your room."
      : "The front desk will call or WhatsApp you shortly to confirm your room.";

  return (
    <main data-anim="wipe" className="bg-aqua flex-1 py-[clamp(48px,7vw,104px)]">
      <div className="wrap flex flex-wrap items-end gap-x-[clamp(40px,7vw,120px)] gap-y-12">
        <div className="flex flex-[1.4_1_360px] flex-col gap-4">
          <span data-anim="rise" style={{ ["--d" as string]: "300ms" }} className="text-teal text-sm font-semibold">
            request sent · your reference
          </span>
          <h1
            data-anim="rise"
            style={{ ["--d" as string]: "420ms" }}
            className="font-display m-0 text-[clamp(72px,15vw,220px)] leading-[0.85] font-extrabold tracking-[-0.06em]"
          >
            {ref ? ref.toLowerCase() : "sent"}
          </h1>
          <p data-anim="rise" style={{ ["--d" as string]: "500ms" }} className="mt-2 mb-0 max-w-[480px] text-[clamp(17px,1.5vw,20px)] leading-[1.6]">
            {first ? `Thanks, ${first}. ` : "Thanks. "}
            {contactLine} You pay when you arrive.
          </p>
        </div>
        <div data-anim="settle" style={{ ["--d" as string]: "560ms" }} className="rounded-frame flex flex-[1_1_320px] flex-col gap-3.5 bg-white p-7">
          {s ? (
            <>
              <Row k="Room" v={`${s.roomName}${s.rooms > 1 ? ` × ${s.rooms}` : ""}`} />
              <Row k={s.stayType === "short_stay" ? "Short stay" : "Dates"} v={`${s.datesText}${s.nightsText ? `, ${s.nightsText}` : ""}`} />
              <Row k="Guests" v={`${s.guests} adult${s.guests === 1 ? "" : "s"}`} />
              {s.offerTitle && <Row k="Offer" v={s.offerTitle} />}
              <div className="border-line flex items-baseline justify-between gap-4 border-t pt-3.5">
                <span className="text-base">Estimated total</span>
                <span className="font-display text-[28px] font-extrabold tracking-[-0.03em]">{s.totalText}</span>
              </div>
            </>
          ) : (
            loaded && <p className="text-slate m-0 text-base leading-normal">Keep your reference handy. The front desk has your request.</p>
          )}
          <a
            href={whatsappHref(s?.hotelWhatsapp || fallbackWhatsapp, waText)}
            className="bg-ink hover:bg-teal mt-2 flex h-14 items-center justify-center rounded-full text-base font-semibold text-white no-underline transition-colors duration-[180ms] hover:text-white"
          >
            Send on WhatsApp
          </a>
          <Link href="/" className="text-teal flex h-12 items-center justify-center font-semibold no-underline">
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4 text-base">
      <span className="text-slate">{k}</span>
      <span className="text-right font-semibold">{v}</span>
    </div>
  );
}
