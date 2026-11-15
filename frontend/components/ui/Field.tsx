"use client";

import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { useId } from "react";
import { cn } from "@/lib/cn";

const CONTROL =
  "w-full rounded-lg border border-hairline bg-surface text-sm text-ink placeholder:text-slate-500 " +
  "transition-colors hover:border-slate-300 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 " +
  "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-muted";

interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "className"> {
  label?: string;

  adornment?: ReactNode;
  className?: string;
}

export function TextInput({ label, adornment, className, id, ...rest }: TextInputProps) {
  const generated = useId();
  const inputId = id ?? generated;

  return (
    <div className={cn("min-w-0", className)}>
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-[13px] font-medium text-muted">
          {label}
        </label>
      )}
      <div className="relative">
        {adornment && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            {adornment}
          </span>
        )}
        <input
          {...rest}
          id={inputId}
          className={cn(CONTROL, "h-10", adornment ? "pl-9 pr-3" : "px-3")}
        />
      </div>
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
        <label htmlFor={selectId} className="mb-1.5 block text-[13px] font-medium text-muted">
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
