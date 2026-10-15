import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Used for every "nothing here" case — no results, filtered out, missing
 * prerequisite. Always takes an action, so the state is never a dead end.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-14 text-center", className)}>
      {icon && (
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-muted">
          {icon}
        </div>
      )}
      <p className="text-sm font-semibold text-ink">{title}</p>
      {description && <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-muted">{description}</p>}
      {action && <div className="mt-4 flex flex-wrap items-center justify-center gap-2">{action}</div>}
    </div>
  );
}
