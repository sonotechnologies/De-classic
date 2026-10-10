"use client";

import clsx from "clsx";
import { useActionState, useState } from "react";
import { Spinner } from "@/components/ui/button";
import { loginAction } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, {});
  const [forgot, setForgot] = useState(false);
  const field = "h-12 rounded-field border-[1.5px] px-3.5 text-base outline-none focus:border-ink";
  return (
    <form action={action} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="login-email" className="text-sm font-semibold">
          Email
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="username"
          required
          defaultValue={state.email}
          className={clsx(field, "border-line")}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="login-password" className="text-sm font-semibold">
          Password
        </label>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={!!state.error || undefined}
          aria-describedby={state.error ? "login-error" : undefined}
          className={clsx(field, state.error ? "border-error" : "border-line")}
        />
        {state.error && (
          <span id="login-error" role="alert" className="text-error text-sm">
            {state.error}
          </span>
        )}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="bg-ink hover:bg-teal inline-flex h-12 items-center justify-center gap-2.5 rounded-full border-0 text-base font-semibold text-white"
      >
        {pending && <Spinner />}
        {pending ? "Signing in…" : "Sign in"}
      </button>
      <button type="button" onClick={() => setForgot((v) => !v)} className="text-teal border-0 bg-transparent text-sm" aria-expanded={forgot}>
        Forgot password?
      </button>
      {forgot && (
        <p className="text-slate m-0 text-center text-sm leading-normal">
          Ask the owner to reset it from Staff in the admin. They&apos;ll give you a temporary password.
        </p>
      )}
    </form>
  );
}
