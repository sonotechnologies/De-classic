"use client";

import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { submitReservation } from "@/app/(site)/book/actions";
import { Spinner } from "@/components/ui/button";
import { dateRange, formatNaira, nightsBetween, plural } from "@/lib/format";
import { whatsappHref } from "@/lib/phone";
import { fieldErrors, MAX_ROOMS, stepOneSchema, stepTwoSchema } from "@/lib/reservation-schema";
import { LAST_REQUEST_KEY } from "@/lib/whatsapp-message";

export type BookRoom = {
  slug: string;
  name: string;
  price: number;
  shortPrice: number | null;
  capacity: number;
};
export type BookBranch = {
  slug: string;
  name: string;
  allowsShortStay: boolean;
  whatsapp: string;
  rooms: BookRoom[];
  offers: { id: string; title: string }[];
};
export type BookInitial = {
  branch: string;
  room: string;
  checkIn: string;
  checkOut: string;
  offer: string;
};

function isoLocal(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"), String(d.getDate()).padStart(2, "0")].join("-");
}

const fieldBox =
  "h-14 w-full rounded-card border-[1.5px] bg-white px-4 text-base font-medium text-ink outline-none transition-colors focus:border-ink";

export function BookForm({ branches, initial }: { branches: BookBranch[]; initial: BookInitial }) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [dir, setDir] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [pending, startTransition] = useTransition();
  const [today, setToday] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  const [f, setF] = useState({
    branch: initial.branch,
    stayType: "overnight" as "overnight" | "short_stay",
    checkIn: initial.checkIn,
    checkOut: initial.checkOut,
    arrivalTime: "",
    room: initial.room,
    rooms: 1,
    guests: 2,
    offer: initial.offer,
    name: "",
    phone: "",
    email: "",
    contactMethod: "whatsapp" as "call" | "whatsapp",
    requests: "",
    website: "",
  });
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => {
    setF((p) => ({ ...p, [k]: v }));
    if (errors[k as string])
      setErrors((prev) => {
        const next = { ...prev };
        delete next[k as string];
        return next;
      });
  };

  // Default dates come from the guest's clock after hydration.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initialise from the client clock after hydration
    setToday(isoLocal(0));
    setF((p) => ({
      ...p,
      checkIn: p.checkIn || isoLocal(0),
      checkOut: p.checkOut || isoLocal(1),
    }));
  }, []);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  const branch = branches.find((b) => b.slug === f.branch) ?? branches[0];
  const room = branch?.rooms.find((r) => r.slug === f.room) ?? branch?.rooms[0];
  const offer = branch?.offers.find((o) => o.id === f.offer) ?? null;
  const shortStay = f.stayType === "short_stay" && !!branch?.allowsShortStay;
  const roomsWithShort = branch?.rooms.filter((r) => r.shortPrice != null) ?? [];

  const summary = useMemo(() => {
    if (!room) return null;
    if (shortStay) {
      const rate = room.shortPrice ?? 0;
      return {
        rate: `${formatNaira(rate)} short stay`,
        dates: f.checkIn ? dateRange(f.checkIn, null) : "Pick a date",
        nights: f.arrivalTime ? `from ${f.arrivalTime}` : "–",
        total: formatNaira(rate * f.rooms),
      };
    }
    const nights = f.checkIn && f.checkOut ? nightsBetween(f.checkIn, f.checkOut) : 0;
    const ok = nights > 0;
    return {
      rate: `${formatNaira(room.price)} / night`,
      dates: ok ? dateRange(f.checkIn, f.checkOut) : "Pick your dates",
      nights: ok ? plural(nights, "night") : "–",
      total: ok ? formatNaira(room.price * nights * f.rooms) : "–",
    };
  }, [room, shortStay, f.checkIn, f.checkOut, f.arrivalTime, f.rooms]);

  if (!branch || !room) {
    return <p className="text-slate text-[17px]">Online booking will open once the rooms are listed. Call or WhatsApp the front desk to book.</p>;
  }

  const maxGuests = Math.min(12, room.capacity * f.rooms);

  function payload() {
    return {
      ...f,
      room: room!.slug,
      stayType: shortStay ? ("short_stay" as const) : ("overnight" as const),
    };
  }

  function next() {
    setFormError("");
    if (step === 1) {
      const r = stepOneSchema.safeParse(payload());
      if (!r.success) return setErrors(fieldErrors(r.error));
      if (f.guests > maxGuests)
        return setErrors({
          guests: `That's more than ${plural(f.rooms, "room")} can sleep. Add a room or pick a bigger one.`,
        });
      setErrors({});
      setDir(1);
      setStep(2);
      return;
    }
    const r = stepTwoSchema.safeParse(payload());
    if (!r.success) return setErrors(fieldErrors(r.error));
    setErrors({});
    startTransition(async () => {
      try {
        const res = await submitReservation(payload());
        if (res.ok) {
          try {
            sessionStorage.setItem(LAST_REQUEST_KEY, JSON.stringify(res.summary));
          } catch {
            /* private mode: the confirmation page falls back to the reference in the URL */
          }
          router.push(`/book/sent?ref=${encodeURIComponent(res.summary.reference)}`);
          return;
        }
        if (res.fieldErrors) {
          setErrors(res.fieldErrors);
          if (res.step === 1) {
            setDir(-1);
            setStep(1);
          }
        }
        if (res.formError) setFormError(res.formError);
      } catch {
        setFormError("Your request didn't send. The connection dropped. Your details are still here. Try again, or send them to us on WhatsApp.");
      }
    });
  }

  const fallbackWhatsapp = whatsappHref(
    branch.whatsapp,
    [
      "Hi De Classic, I'd like to book a room.",
      `Name: ${f.name}`,
      `Room: ${room.name}${f.rooms > 1 ? ` × ${f.rooms}` : ""}`,
      shortStay ? `Short stay: ${f.checkIn}, arriving ${f.arrivalTime}` : `Dates: ${f.checkIn} to ${f.checkOut}`,
      `Guests: ${f.guests}`,
      offer ? `Offer: ${offer.title}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  );

  const err = (k: string) =>
    errors[k] ? (
      <span id={`${k}-error`} role="alert" className="text-error text-[15px] font-medium">
        {errors[k]}
      </span>
    ) : null;
  const aria = (k: string) => ({
    "aria-invalid": !!errors[k] || undefined,
    "aria-describedby": errors[k] ? `${k}-error` : undefined,
  });
  const border = (k: string) => (errors[k] ? "border-error" : "border-line");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        next();
      }}
      noValidate
      className="flex flex-col gap-8"
    >
      <div>
        <span className="text-teal mb-3 block text-sm font-semibold">{step === 1 ? "step 1 of 2 · your stay" : "step 2 of 2 · your details"}</span>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="font-display m-0 text-[clamp(44px,6vw,80px)] leading-[0.92] font-extrabold tracking-[-0.055em] outline-none"
        >
          {step === 1 ? "when are you coming?" : "how do we reach you?"}
        </h1>
        <div className="mt-5 flex gap-1.5" aria-hidden="true">
          <span className="bg-ink h-1.5 flex-1 rounded-full" />
          <span className={clsx("h-1.5 flex-1 rounded-full", step === 2 ? "bg-ink" : "bg-line")} />
        </div>
      </div>

      {formError && (
        <div role="alert" className="rounded-card border-error bg-error-tint flex flex-col gap-2.5 border-[1.5px] px-[18px] py-4">
          <span className="text-error-deep text-base font-bold">Your request didn&apos;t send</span>
          <span className="text-[15px] leading-normal">{formError}</span>
          <div className="flex flex-wrap gap-2.5">
            <button type="submit" className="bg-ink inline-flex h-11 items-center rounded-full px-5 text-sm font-semibold text-white">
              Try again
            </button>
            <a
              href={fallbackWhatsapp}
              className="border-ink text-ink inline-flex h-11 items-center rounded-full border-[1.5px] px-5 text-sm font-semibold no-underline"
            >
              Send on WhatsApp
            </a>
          </div>
        </div>
      )}

      <div key={step} className="step-slide flex flex-col gap-5" style={{ ["--from-x" as string]: `${dir * 40}px` }}>
        {step === 1 ? (
          <>
            {branches.length > 1 && (
              <div className="flex flex-col gap-2">
                <label htmlFor="bk-branch" className="text-sm font-semibold">
                  Branch
                </label>
                <select
                  id="bk-branch"
                  value={f.branch}
                  onChange={(e) =>
                    setF((p) => ({
                      ...p,
                      branch: e.target.value,
                      room: "",
                      offer: "",
                      stayType: "overnight",
                    }))
                  }
                  className={clsx(fieldBox, border("branch"))}
                  {...aria("branch")}
                >
                  {branches.map((b) => (
                    <option key={b.slug} value={b.slug}>
                      {b.name}
                    </option>
                  ))}
                </select>
                {err("branch")}
              </div>
            )}

            {branch.allowsShortStay && roomsWithShort.length > 0 && (
              <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
                <legend className="mb-2 p-0 text-sm font-semibold">Stay</legend>
                <div className="grid grid-cols-2 gap-2">
                  {(["overnight", "short_stay"] as const).map((t) => (
                    <label
                      key={t}
                      className={clsx(
                        "has-[:focus-visible]:outline-ink flex h-14 cursor-pointer items-center justify-center rounded-full border-[1.5px] text-base font-semibold has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-3",
                        f.stayType === t ? "border-ink bg-ink text-white" : "border-line text-ink bg-white",
                      )}
                    >
                      <input
                        type="radio"
                        name="stayType"
                        value={t}
                        checked={f.stayType === t}
                        onChange={() => {
                          set("stayType", t);
                          if (t === "short_stay" && room.shortPrice == null) set("room", roomsWithShort[0].slug);
                        }}
                        className="sr-only"
                      />
                      {t === "overnight" ? "Overnight" : "Short stay"}
                    </label>
                  ))}
                </div>
                {err("stayType")}
              </fieldset>
            )}

            <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-5">
              <div className="flex flex-col gap-2">
                <label htmlFor="bk-checkIn" className="text-sm font-semibold">
                  {shortStay ? "Date" : "Check in"}
                </label>
                <input
                  id="bk-checkIn"
                  type="date"
                  value={f.checkIn}
                  min={today}
                  onChange={(e) => set("checkIn", e.target.value)}
                  className={clsx(fieldBox, border("checkIn"))}
                  {...aria("checkIn")}
                />
                {err("checkIn")}
              </div>
              {shortStay ? (
                <div className="flex flex-col gap-2">
                  <label htmlFor="bk-arrivalTime" className="text-sm font-semibold">
                    Arriving around
                  </label>
                  <input
                    id="bk-arrivalTime"
                    type="time"
                    value={f.arrivalTime}
                    onChange={(e) => set("arrivalTime", e.target.value)}
                    className={clsx(fieldBox, border("arrivalTime"))}
                    {...aria("arrivalTime")}
                  />
                  {err("arrivalTime")}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <label htmlFor="bk-checkOut" className="text-sm font-semibold">
                    Check out
                  </label>
                  <input
                    id="bk-checkOut"
                    type="date"
                    value={f.checkOut}
                    min={f.checkIn || today}
                    onChange={(e) => set("checkOut", e.target.value)}
                    className={clsx(fieldBox, border("checkOut"))}
                    {...aria("checkOut")}
                  />
                  {err("checkOut")}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="bk-room" className="text-sm font-semibold">
                Room
              </label>
              <select
                id="bk-room"
                value={room.slug}
                onChange={(e) => set("room", e.target.value)}
                className={clsx(fieldBox, border("room"))}
                {...aria("room")}
              >
                {(shortStay ? roomsWithShort : branch.rooms).map((r) => (
                  <option key={r.slug} value={r.slug}>
                    {r.name} · {formatNaira(shortStay ? (r.shortPrice ?? 0) : r.price)}
                  </option>
                ))}
              </select>
              {err("room")}
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="flex flex-col gap-2">
                <label htmlFor="bk-rooms" className="text-sm font-semibold">
                  Rooms
                </label>
                <select
                  id="bk-rooms"
                  value={f.rooms}
                  onChange={(e) => set("rooms", Number(e.target.value))}
                  className={clsx(fieldBox, "border-line")}
                >
                  {Array.from({ length: MAX_ROOMS }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {plural(n, "room")}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="bk-guests" className="text-sm font-semibold">
                  Guests
                </label>
                <select
                  id="bk-guests"
                  value={f.guests}
                  onChange={(e) => set("guests", Number(e.target.value))}
                  className={clsx(fieldBox, border("guests"))}
                  {...aria("guests")}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {plural(n, "adult")}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {err("guests")}
          </>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <label htmlFor="bk-name" className="text-sm font-semibold">
                Full name
              </label>
              <input
                id="bk-name"
                type="text"
                value={f.name}
                onChange={(e) => set("name", e.target.value)}
                autoComplete="name"
                placeholder="As it will appear at check in"
                className={clsx(fieldBox, border("name"))}
                {...aria("name")}
              />
              {err("name")}
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="bk-phone" className="text-sm font-semibold">
                Phone number
              </label>
              <input
                id="bk-phone"
                type="tel"
                inputMode="tel"
                value={f.phone}
                onChange={(e) => set("phone", e.target.value)}
                autoComplete="tel"
                placeholder="080 0000 0000"
                className={clsx(fieldBox, border("phone"))}
                {...aria("phone")}
              />
              {err("phone")}
            </div>
            <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
              <legend className="mb-2 p-0 text-sm font-semibold">How should we reach you?</legend>
              <div className="grid grid-cols-2 gap-2">
                {(["whatsapp", "call"] as const).map((m) => (
                  <label
                    key={m}
                    className={clsx(
                      "has-[:focus-visible]:outline-ink flex h-14 cursor-pointer items-center justify-center rounded-full border-[1.5px] text-base font-semibold has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-3",
                      f.contactMethod === m ? "border-ink bg-ink text-white" : "border-line text-ink bg-white",
                    )}
                  >
                    <input
                      type="radio"
                      name="contactMethod"
                      value={m}
                      checked={f.contactMethod === m}
                      onChange={() => set("contactMethod", m)}
                      className="sr-only"
                    />
                    {m === "whatsapp" ? "WhatsApp" : "Phone call"}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="flex flex-col gap-2">
              <label htmlFor="bk-email" className="text-sm font-semibold">
                Email <span className="text-slate font-normal">Optional</span>
              </label>
              <input
                id="bk-email"
                type="email"
                value={f.email}
                onChange={(e) => set("email", e.target.value)}
                autoComplete="email"
                className={clsx(fieldBox, border("email"))}
                {...aria("email")}
              />
              {err("email")}
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="bk-requests" className="text-sm font-semibold">
                Anything we should know? <span className="text-slate font-normal">Optional</span>
              </label>
              <textarea
                id="bk-requests"
                value={f.requests}
                onChange={(e) => set("requests", e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Late arrival, birthday, extra pillow"
                className={clsx(
                  "rounded-card text-ink focus:border-ink w-full resize-y border-[1.5px] bg-white px-4 py-3.5 text-base font-medium outline-none",
                  border("requests"),
                )}
                {...aria("requests")}
              />
              {err("requests")}
            </div>
            {/* Honeypot: hidden from people, filled by bots. */}
            <div aria-hidden="true" className="absolute top-auto left-[-9999px] h-px w-px overflow-hidden">
              <label>
                Website
                <input type="text" tabIndex={-1} autoComplete="off" value={f.website} onChange={(e) => set("website", e.target.value)} />
              </label>
            </div>
            <p className="text-slate m-0 text-sm leading-normal">
              We only use your name and number to confirm this reservation. <a href="/privacy">Privacy</a>
            </p>
          </>
        )}
      </div>

      {summary && (
        <div className="rounded-frame bg-aqua-tint flex flex-col gap-3 p-6" aria-live="polite">
          <span className="text-teal text-sm font-semibold">your stay</span>
          <div className="flex justify-between gap-4 text-base">
            <span>
              {room.name}
              {f.rooms > 1 ? ` × ${f.rooms}` : ""}
            </span>
            <span className="font-semibold">{summary.rate}</span>
          </div>
          <div className="flex justify-between gap-4 text-base">
            <span>{summary.dates}</span>
            <span className="font-semibold">{summary.nights}</span>
          </div>
          {offer && (
            <div className="flex items-center justify-between gap-4 text-base">
              <span>
                Offer: <span className="font-semibold">{offer.title}</span>
              </span>
              <button
                type="button"
                onClick={() => set("offer", "")}
                className="text-teal border-0 bg-transparent p-0 text-sm font-semibold underline"
              >
                Remove
              </button>
            </div>
          )}
          <div className="border-line flex items-baseline justify-between gap-4 border-t pt-3">
            <span className="text-base">Estimated total</span>
            <span className="font-display text-[28px] font-extrabold tracking-[-0.03em]">{summary.total}</span>
          </div>
          <span className="text-slate text-sm leading-normal">
            Nothing to pay now. The hotel confirms by phone or WhatsApp, and you pay at check in.
            {offer ? " Any offer discount is taken off when you pay." : ""}
          </span>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {step === 2 && (
          <button
            type="button"
            onClick={() => {
              setDir(-1);
              setStep(1);
              setFormError("");
            }}
            className="border-ink text-ink h-14 rounded-full border-[1.5px] bg-white px-7 text-base font-semibold"
          >
            Back
          </button>
        )}
        <button
          type="submit"
          disabled={pending}
          className="bg-ink hover:bg-teal disabled:hover:bg-ink inline-flex h-14 min-w-[200px] flex-1 items-center justify-center gap-2.5 rounded-full border-0 px-7 text-base font-semibold text-white transition-colors duration-[180ms]"
        >
          {pending && <Spinner />}
          {step === 1 ? "Continue" : pending ? "Sending…" : "Send request"}
        </button>
      </div>
    </form>
  );
}
