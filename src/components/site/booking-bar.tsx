"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useState } from "react";

export type BarBranch = {
  slug: string;
  name: string;
  rooms: { slug: string; name: string }[];
};

function isoLocal(offsetDays: number) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"), String(d.getDate()).padStart(2, "0")].join("-");
}

/** The white pill on the paint line under the hero: dates and room, prefilled into the Book page. */
export function BookingBar({ branches, current }: { branches: BarBranch[]; current: string }) {
  const router = useRouter();
  const uid = useId();
  const [branch, setBranch] = useState(current);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [room, setRoom] = useState("");
  const [today, setToday] = useState("");

  // Dates come from the guest's clock, not the build, so a cached page never shows stale defaults.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initialise from the client clock after hydration
    setToday(isoLocal(0));
    setCheckIn((v) => v || isoLocal(0));
    setCheckOut((v) => v || isoLocal(1));
  }, []);

  const rooms = useMemo(() => branches.find((b) => b.slug === branch)?.rooms ?? [], [branches, branch]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = new URLSearchParams();
    if (branches.length > 1) q.set("branch", branch);
    if (checkIn) q.set("checkIn", checkIn);
    if (checkOut) q.set("checkOut", checkOut);
    if (room) q.set("room", room);
    router.push(`/book?${q}`);
  }

  const field = "flex flex-col justify-center gap-0.5 px-5 py-2.5";
  const input = "min-h-6 w-full border-0 bg-transparent p-0 text-base font-medium text-ink outline-none";
  const divider = "md:border-l md:border-line";

  return (
    <form
      onSubmit={submit}
      data-anim="settle"
      style={{ ["--d" as string]: "480ms" }}
      className="rounded-frame border-ink flex max-w-[calc(100%-clamp(0px,36vw,520px)+120px)] flex-wrap items-stretch border-[1.5px] bg-white p-2 max-md:max-w-none md:rounded-full"
    >
      {branches.length > 1 && (
        <label className={`${field} flex-[1_1_140px]`}>
          <span id={`${uid}-branch`} className="text-teal text-[13px] font-semibold">
            branch
          </span>
          <select
            aria-labelledby={`${uid}-branch`}
            value={branch}
            onChange={(e) => {
              setBranch(e.target.value);
              setRoom("");
            }}
            className={input}
          >
            {branches.map((b) => (
              <option key={b.slug} value={b.slug}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className={`${field} flex-[1_1_140px] ${branches.length > 1 ? divider : ""}`}>
        <span id={`${uid}-check-in`} className="text-teal text-[13px] font-semibold">
          check in
        </span>
        <input
          aria-labelledby={`${uid}-check-in`}
          type="date"
          value={checkIn}
          min={today}
          onChange={(e) => setCheckIn(e.target.value)}
          className={input}
        />
      </label>
      <label className={`${field} border-line flex-[1_1_140px] border-l`}>
        <span id={`${uid}-check-out`} className="text-teal text-[13px] font-semibold">
          check out
        </span>
        <input
          aria-labelledby={`${uid}-check-out`}
          type="date"
          value={checkOut}
          min={checkIn || today}
          onChange={(e) => setCheckOut(e.target.value)}
          className={input}
        />
      </label>
      <label className={`${field} flex-[1_1_150px] ${divider}`}>
        <span id={`${uid}-room`} className="text-teal text-[13px] font-semibold">
          room
        </span>
        <select aria-labelledby={`${uid}-room`} value={room} onChange={(e) => setRoom(e.target.value)} className={input}>
          <option value="">Any room</option>
          {rooms.map((r) => (
            <option key={r.slug} value={r.slug}>
              {r.name}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        className="bg-ink hover:bg-teal min-h-14 flex-[1_1_160px] rounded-full border-0 text-base font-semibold text-white transition-colors duration-[180ms]"
      >
        Check availability
      </button>
    </form>
  );
}
