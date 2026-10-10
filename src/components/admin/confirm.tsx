"use client";

import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import type { ActionState } from "@/lib/admin-actions";
import { Spinner } from "@/components/ui/button";
import { useToast } from "./toast";

/**
 * A button that asks before doing something destructive. The action runs on the server; on success we
 * show its message and optionally navigate.
 */
export function ConfirmButton({
  label,
  title,
  body,
  confirmLabel,
  run,
  redirectTo,
  className,
  quiet,
}: {
  label: string;
  title: string;
  body: string;
  confirmLabel: string;
  run: () => Promise<ActionState>;
  redirectTo?: string;
  className?: string;
  quiet?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError("");
          setOpen(true);
        }}
        className={clsx(
          quiet
            ? "text-danger h-11 border-0 bg-transparent px-3 text-[15px] font-semibold"
            : "text-danger h-12 border-0 bg-transparent px-4 text-[15px] font-semibold",
          className,
        )}
      >
        {label}
      </button>
      {open && (
        <div role="dialog" aria-modal="true" aria-label={title} className="bg-ink/40 fixed inset-0 z-[200] flex items-center justify-center p-5">
          <div className="flex w-full max-w-[400px] flex-col gap-3.5 rounded-[20px] bg-white p-6">
            <span className="text-xl font-bold">{title}</span>
            <span className="text-slate text-[15px] leading-normal">{body}</span>
            {error && (
              <span role="alert" className="text-error text-sm">
                {error}
              </span>
            )}
            <div className="mt-1.5 flex justify-end gap-2.5">
              <button
                ref={cancelRef}
                type="button"
                onClick={() => setOpen(false)}
                className="border-ink h-11 rounded-full border-[1.5px] bg-white px-5 text-[15px] font-semibold"
              >
                Keep it
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    const res = await run();
                    if (!res.ok) return setError(res.formError || "Couldn't do that. Try again.");
                    setOpen(false);
                    if (res.message) toast(res.message);
                    if (redirectTo) router.push(redirectTo);
                  })
                }
                className="bg-danger inline-flex h-11 items-center gap-2 rounded-full border-0 px-5 text-[15px] font-semibold text-white"
              >
                {pending && <Spinner />}
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
