import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-hover disabled:bg-slate-200 disabled:text-muted",
  secondary:
    "bg-surface text-ink border border-hairline hover:bg-slate-50 disabled:text-muted disabled:hover:bg-surface",
  ghost: "text-muted hover:bg-slate-100 hover:text-ink disabled:hover:bg-transparent",
  danger: "bg-danger text-white hover:bg-red-700 disabled:bg-slate-200 disabled:text-muted",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Shows a spinner and blocks interaction without changing the label's width. */
  loading?: boolean;
  icon?: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg font-medium transition-colors",
        "disabled:cursor-not-allowed",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
    >
      {loading ? <Spinner /> : icon}
      {children}
    </button>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-current/30 border-t-current",
        className,
      )}
    />
  );
}

/** Anchor styled as a button, for links that genuinely navigate away. */
export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  icon,
  className,
  children,
  ...rest
}: { href: string; variant?: Variant; size?: Size; icon?: ReactNode; className?: string; children: ReactNode } & Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  "href" | "className"
>) {
  return (
    <a
      {...rest}
      href={href}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg font-medium transition-colors",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
    >
      {icon}
      {children}
    </a>
  );
}
