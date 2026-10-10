"use client";

import { useEffect } from "react";

export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => console.error(error), [error]);
  return (
    <main className="bg-aqua py-[clamp(56px,9vw,140px)]">
      <div className="wrap flex flex-col items-start gap-6">
        <span className="text-teal text-sm font-semibold">something went wrong</span>
        <h1 className="font-display m-0 max-w-[14ch] text-[clamp(48px,8vw,116px)] leading-[0.9] font-extrabold tracking-[-0.055em]">
          this page didn&apos;t load
        </h1>
        <p className="m-0 max-w-[440px] text-lg leading-[1.6]">It&apos;s on our side, not yours. Try again, or call the front desk to book.</p>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={reset} className="bg-ink hover:bg-teal h-14 rounded-full px-7 text-base font-semibold text-white">
            Try again
          </button>
          <a href="/" className="border-ink text-ink inline-flex h-14 items-center rounded-full border-[1.5px] px-7 font-semibold no-underline">
            Back to home
          </a>
        </div>
      </div>
    </main>
  );
}
