"use client";

import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { useId } from "react";
import { cn } from "@/lib/cn";

const CONTROL =
  "w-full rounded-lg border border-hairline bg-surface text-sm text-ink placeholder:text-slate-400 " +
  "transition-colors hover:border-slate-300 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 " +
  "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-muted";

interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "className"> {
  label?: string;
  /** Rendered inside the field on the left, e.g. a search glyph. */
  adornment?: ReactNode;
  className?: string;
  hint?: string;
}

export function TextInput({ label, adornment, className, hint, id, ...rest }: TextInputProps) {
  const generated = useId();
  const inputId = id ?? generated;
  const hintId = hint ? `${inputId}-hint` : undefined;

  return (
    <div className={cn("min-w-0", className)}>
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-xs font-medium text-muted">
          {label}
        </label>
      )}
      <div className="relative">
        {adornment && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {adornment}
          </span>
        )}
        <input
          {...rest}
          id={inputId}
          aria-describedby={hintId}
          className={cn(CONTROL, "h-10", adornment ? "pl-9 pr-3" : "px-3")}
        />
      </div>
      {hint && (
        <p id={hintId} className="mt-1 text-xs text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "className"> {
  label?: string;
  className?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, className, options, id, ...rest }: SelectProps) {
  const generated = useId();
  const selectId = id ?? generated;

  return (
    <div className={cn("min-w-0", className)}>
      {label && (
        <label htmlFor={selectId} className="mb-1.5 block text-xs font-medium text-muted">
          {label}
        </label>
      )}
      <select {...rest} id={selectId} className={cn(CONTROL, "h-10 cursor-pointer px-3")}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
