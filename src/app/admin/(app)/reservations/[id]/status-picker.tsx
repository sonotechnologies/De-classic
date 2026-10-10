"use client";

import { useOptimistic, useTransition } from "react";
import { useToast } from "@/components/admin/toast";
import type { ReservationStatus } from "@/db/schema";
import { STATUS_LABEL, STATUS_TAG, STATUSES } from "@/lib/status";
import { changeStatus } from "../actions";

export function StatusPicker({ id, status }: { id: string; status: ReservationStatus }) {
  const [current, setOptimistic] = useOptimistic(status);
  const [pending, start] = useTransition();
  const toast = useToast();
  return (
    <div className="rounded-card border-line flex flex-col gap-3 border p-[18px]">
      <span id="status-label" className="text-sm font-semibold">
        Status
      </span>
      <div role="group" aria-labelledby="status-label" className="flex flex-wrap gap-2">
        {STATUSES.map((s) => {
          const on = current === s;
          return (
            <button
              key={s}
              type="button"
              aria-pressed={on}
              disabled={pending}
              onClick={() =>
                start(async () => {
                  setOptimistic(s);
                  const res = await changeStatus(id, s);
                  if (res.ok && res.message) toast(res.message);
                  if (!res.ok) toast(res.formError ?? "Couldn't change the status.", "error");
                })
              }
              className="h-10 rounded-full border-[1.5px] px-3.5 text-sm font-semibold"
              style={
                on
                  ? {
                      background: STATUS_TAG[s].bg,
                      color: STATUS_TAG[s].fg,
                      borderColor: "#111111",
                    }
                  : {
                      background: "#FFFFFF",
                      color: "#111111",
                      borderColor: "#D5E5E5",
                    }
              }
            >
              {STATUS_LABEL[s]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
