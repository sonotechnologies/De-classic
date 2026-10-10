"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

type Tone = "success" | "error";
const ToastContext = createContext<(msg: string, tone?: Tone) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

/** Plain green success pill (or red on failure), bottom centre; sits above the tab bar on phones. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [msg, setMsg] = useState("");
  const [tone, setTone] = useState<Tone>("success");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const show = useCallback((m: string, t: Tone = "success") => {
    setMsg(m);
    setTone(t);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(""), 2600);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-[84px] z-[150] flex justify-center md:bottom-8">
        {msg && (
          <div
            className={`max-w-[calc(100vw-32px)] rounded-full px-5 py-3 text-center text-[15px] font-semibold text-white ${tone === "error" ? "bg-error-deep" : "bg-success"}`}
          >
            {msg}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}
