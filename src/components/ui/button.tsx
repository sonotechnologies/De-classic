import clsx from "clsx";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "gold" | "danger" | "quiet";
type Size = "sm" | "md" | "lg" | "xl";

const base =
  "inline-flex items-center justify-center gap-2.5 rounded-full font-semibold no-underline whitespace-nowrap transition-colors duration-[180ms] ease-out disabled:cursor-not-allowed";

const variants: Record<Variant, string> = {
  // Ink pill fills to deep teal on hover.
  primary: "bg-ink text-white hover:bg-teal hover:text-white disabled:bg-line disabled:text-slate",
  secondary:
    "border-[1.5px] border-ink text-ink bg-transparent hover:bg-ink hover:text-white disabled:border-line disabled:text-slate disabled:hover:bg-transparent",
  // Bar section only.
  gold: "bg-gold text-ink hover:bg-white hover:text-ink",
  danger: "bg-danger text-white hover:bg-error-deep hover:text-white",
  quiet: "bg-transparent text-teal hover:text-ink",
};

const sizes: Record<Size, string> = {
  sm: "h-11 px-5 text-[15px]",
  md: "h-12 px-6 text-base",
  lg: "h-[52px] px-[26px] text-base",
  xl: "h-14 px-7 text-base",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return clsx(base, variants[variant], sizes[size], className);
}

type ButtonProps = ComponentProps<"button"> & {
  variant?: Variant;
  size?: Size;
  pending?: boolean;
};

export function Button({ variant = "primary", size = "md", pending, className, children, disabled, ...rest }: ButtonProps) {
  return (
    <button className={buttonClass(variant, size, className)} disabled={disabled || pending} aria-busy={pending || undefined} {...rest}>
      {pending && <Spinner />}
      {children}
    </button>
  );
}

type LinkProps = ComponentProps<typeof Link> & {
  variant?: Variant;
  size?: Size;
};

export function ButtonLink({ variant = "primary", size = "md", className, ...rest }: LinkProps) {
  return <Link className={buttonClass(variant, size, className)} {...rest} />;
}

/** External or tel:/wa.me links styled as buttons. */
export function ButtonA({ variant = "primary", size = "md", className, ...rest }: ComponentProps<"a"> & { variant?: Variant; size?: Size }) {
  return <a className={buttonClass(variant, size, className)} {...rest} />;
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={clsx("border-slate inline-block size-4 animate-spin rounded-full border-2 border-t-white motion-reduce:animate-none", className)}
    />
  );
}

/** Deep teal text link whose arrow nudges right on hover. */
export function ArrowLink({ children, className, ...rest }: ComponentProps<typeof Link> & { children: ReactNode }) {
  return (
    <Link
      className={clsx(
        "text-teal hover:text-teal inline-flex items-center gap-2 font-semibold no-underline transition-[gap] duration-[180ms] ease-out hover:gap-3",
        className,
      )}
      {...rest}
    >
      {children} <span aria-hidden="true">→</span>
    </Link>
  );
}
