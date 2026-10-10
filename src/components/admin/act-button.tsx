"use client";

import clsx from "clsx";
import { useTransition, type ReactNode } from "react";
import type { ActionState } from "@/lib/admin-actions";
import { useToast } from "./toast";

/** A small button that runs one server action (already bound to its arguments) and reports the result in a toast. */
export function ActButton({
  run,
  children,
  className,
  label,
  disabled,
}: {
  run: () => Promise<ActionState>;
  children: ReactNode;
  className?: string;
  label?: string;
  disabled?: boolean;
}) {
  const [pending, start] = useTransition();
  const toast = useToast();
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      onClick={() =>
        start(async () => {
          const r = await run();
          if (!r.ok) toast(r.formError || "Couldn't do that. Try again.", "error");
          else if (r.message) toast(r.message);
        })
      }
      className={clsx("disabled:opacity-40", className)}
    >
      {children}
    </button>
  );
}
