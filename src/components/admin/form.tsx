"use client";

import clsx from "clsx";
import { useRouter } from "next/navigation";
import { createContext, startTransition, useActionState, useContext, useEffect, useId, useRef, type ReactNode } from "react";
import type { ActionState } from "@/lib/admin-actions";
import { Spinner } from "@/components/ui/button";
import { useToast } from "./toast";

type Action = (prev: ActionState, fd: FormData) => Promise<ActionState>;

const FormCtx = createContext<{
  errors: Record<string, string>;
  pending: boolean;
  formError?: string;
}>({ errors: {}, pending: false });

/**
 * Admin form: submits a server action without React's automatic reset (so nothing typed is lost on an error),
 * shows field errors beside fields, a summary above Save, and a green toast on success.
 */
export function ActionForm({
  action,
  children,
  className,
  onDone,
  resetOnSuccess,
}: {
  action: Action;
  children: ReactNode;
  className?: string;
  onDone?: (s: ActionState) => void;
  resetOnSuccess?: boolean;
}) {
  const [state, run, pending] = useActionState(action, {});
  const toast = useToast();
  const router = useRouter();
  const ref = useRef<HTMLFormElement>(null);
  const last = useRef<ActionState>(state);

  useEffect(() => {
    if (state === last.current) return;
    last.current = state;
    if (state.ok) {
      if (state.message) toast(state.message);
      if (resetOnSuccess) ref.current?.reset();
      onDone?.(state);
      if (state.redirectTo) router.push(state.redirectTo);
    } else if (state.errors || state.formError) {
      ref.current?.querySelector<HTMLElement>("[aria-invalid=true]")?.focus();
    }
  }, [state, toast, onDone, resetOnSuccess, router]);

  return (
    <FormCtx.Provider
      value={{
        errors: state.errors ?? {},
        pending,
        formError: state.formError,
      }}
    >
      <form
        ref={ref}
        noValidate
        className={className}
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          startTransition(() => run(fd));
        }}
      >
        {children}
      </form>
    </FormCtx.Provider>
  );
}

export function useFormState() {
  return useContext(FormCtx);
}

/** "Couldn't save. Check 1 field." shown above the Save button, or the form-level error. */
export function ErrorSummary() {
  const { errors, formError } = useFormState();
  const n = Object.keys(errors).filter((k) => k !== "form").length;
  if (!n && !formError) return null;
  return (
    <div role="alert" className="rounded-field bg-error-tint flex flex-col gap-1.5 p-3.5">
      <span className="text-error-deep text-sm font-bold">{n ? `Couldn't save. Check ${n} field${n === 1 ? "" : "s"}.` : formError}</span>
      {n > 0 && formError && <span className="text-[13px]">{formError}</span>}
    </div>
  );
}

const box = "w-full rounded-field border-[1.5px] bg-white px-3.5 text-base text-ink outline-none transition-colors focus:border-ink";

type FieldIds = { id: string; describedBy: string | undefined; invalid: boolean };

/**
 * Label above, hint and plain-words error below. The label is tied to the control with htmlFor, and the
 * hint and error are announced through aria-describedby, so the field's name is just its label.
 */
function FieldShell({
  name,
  label,
  hint,
  className,
  children,
}: {
  name: string;
  label: ReactNode;
  hint?: ReactNode;
  className?: string;
  children: (ids: FieldIds) => ReactNode;
}) {
  const { errors } = useFormState();
  const id = useId();
  const error = errors[name];
  const describedBy = [hint ? `${id}-hint` : "", error ? `${id}-err` : ""].filter(Boolean).join(" ") || undefined;
  return (
    <div className={clsx("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      {hint && (
        <span id={`${id}-hint`} className="text-slate text-[13px]">
          {hint}
        </span>
      )}
      {children({ id, describedBy, invalid: !!error })}
      {error && (
        <span id={`${id}-err`} className="text-error text-sm">
          {error}
        </span>
      )}
    </div>
  );
}

const a11y = ({ id, describedBy, invalid }: FieldIds) => ({ id, "aria-describedby": describedBy, "aria-invalid": invalid || undefined });

type Base = { name: string; label: ReactNode; hint?: ReactNode; className?: string };

export function TextField({ name, label, hint, className, ...input }: Base & Omit<React.ComponentProps<"input">, "name">) {
  return (
    <FieldShell name={name} label={label} hint={hint} className={className}>
      {(ids) => <input name={name} className={clsx(box, "h-12", ids.invalid ? "border-error" : "border-line")} {...a11y(ids)} {...input} />}
    </FieldShell>
  );
}

export function TextArea({ name, label, hint, className, ...input }: Base & Omit<React.ComponentProps<"textarea">, "name">) {
  return (
    <FieldShell name={name} label={label} hint={hint} className={className}>
      {(ids) => (
        <textarea
          name={name}
          rows={3}
          className={clsx(box, "resize-y py-3", ids.invalid ? "border-error" : "border-line")}
          {...a11y(ids)}
          {...input}
        />
      )}
    </FieldShell>
  );
}

export function SelectField({
  name,
  label,
  hint,
  className,
  options,
  ...input
}: Base & { options: { value: string; label: string }[] } & Omit<React.ComponentProps<"select">, "name">) {
  return (
    <FieldShell name={name} label={label} hint={hint} className={className}>
      {(ids) => (
        <select name={name} className={clsx(box, "h-12", ids.invalid ? "border-error" : "border-line")} {...a11y(ids)} {...input}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </FieldShell>
  );
}

export function CheckboxField({ name, label, defaultChecked, hint }: { name: string; label: ReactNode; defaultChecked?: boolean; hint?: ReactNode }) {
  return (
    <label className="flex min-h-11 items-start gap-3 py-2.5 text-base">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="accent-ink mt-0.5 size-[22px] flex-none" />
      <span className="flex flex-col gap-0.5">
        {label}
        {hint && <span className="text-slate text-[13px]">{hint}</span>}
      </span>
    </label>
  );
}

export function SubmitButton({
  children,
  className,
  variant = "primary",
}: {
  children: ReactNode;
  className?: string;
  variant?: "primary" | "secondary";
}) {
  const { pending } = useFormState();
  return (
    <button
      type="submit"
      disabled={pending}
      className={clsx(
        "inline-flex h-12 items-center justify-center gap-2.5 rounded-full px-6 text-base font-semibold transition-colors duration-[180ms]",
        variant === "primary"
          ? "bg-ink hover:bg-teal border-0 text-white"
          : "border-ink text-ink hover:bg-ink border-[1.5px] bg-white hover:text-white",
        className,
      )}
    >
      {pending && <Spinner />}
      {children}
    </button>
  );
}
