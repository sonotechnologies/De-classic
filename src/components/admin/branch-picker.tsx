"use client";

import { usePathname, useRouter } from "next/navigation";
import { useId } from "react";

/** Lets the owner switch which branch an admin screen is editing. Hidden when there is only one branch. */
export function BranchPicker({ branches, current }: { branches: { id: string; name: string }[]; current: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const uid = useId();
  if (branches.length < 2) return null;
  return (
    <label className="border-line focus-within:border-ink flex h-11 items-center gap-2 self-start rounded-full border-[1.5px] bg-white pr-2 pl-4 text-[15px]">
      <span id={`${uid}-branch`} className="text-teal text-[13px] font-semibold">
        branch
      </span>
      <select
        aria-labelledby={`${uid}-branch`}
        value={current}
        onChange={(e) => router.push(`${pathname}?branch=${e.target.value}`)}
        className="h-full border-0 bg-transparent font-medium outline-none"
      >
        {branches.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>
    </label>
  );
}
