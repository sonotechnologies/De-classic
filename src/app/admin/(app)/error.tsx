"use client";

import { useEffect } from "react";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => console.error(error), [error]);
  return (
    <div role="alert" className="rounded-card border-error bg-error-tint flex flex-col gap-2.5 border-[1.5px] px-[18px] py-4">
      <span className="text-error-deep text-base font-bold">This screen didn&apos;t load</span>
      <span className="text-[15px] leading-normal">The connection may have dropped. Nothing you saved is lost.</span>
      <button
        type="button"
        onClick={reset}
        className="bg-ink inline-flex h-11 items-center self-start rounded-full px-5 text-sm font-semibold text-white"
      >
        Try again
      </button>
    </div>
  );
}
