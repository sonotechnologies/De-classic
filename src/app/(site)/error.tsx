"use client";

import { useEffect } from "react";

export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => console.error(error), [error]);
  return (
    <main className="bg-aqua py-[clamp(56px,9vw,140px)]">
      <div className="wrap flex flex-col items-start gap-6">
        <span className="text-sm font-semibold text-teal">something went wrong</span>
        <h1 className="m-0 max-w-[14ch] font-display text-[clamp(48px,8vw,116px)] font-extrabold leading-[0.9] tracking-[-0.055em]">
          this page didn&apos;t load
        </h1>
        <p className="m-0 max-w-[440px] text-lg leading-[1.6]">It&apos;s on our side, not yours. Try again, or call the front desk to book.</p>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={reset} className="h-14 rounded-full bg-ink px-7 text-base font-semibold text-white hover:bg-teal">
            Try again
          </button>
          <a href="/" className="inline-flex h-14 items-center rounded-full border-[1.5px] border-ink px-7 font-semibold text-ink no-underline">
            Back to home
          </a>
        </div>
      </div>
    </main>
  );
}
