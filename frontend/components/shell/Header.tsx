"use client";

import { Menu, RefreshCw } from "lucide-react";
import { WORKSPACE_LABELS, type Workspace } from "@/lib/workspace";

export default function Header({
  current,
  busy,
  onOpenNav,
}: {
  current: Workspace;
  /** True while an analysis is in flight. */
  busy: boolean;
  onOpenNav: () => void;
}) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-hairline bg-surface px-4 sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={onOpenNav}
        aria-label="Open navigation"
        className="-ml-1 rounded-lg p-2 text-muted transition-colors hover:bg-slate-100 hover:text-ink lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <h1 className="min-w-0 flex-1 truncate text-[15px] font-semibold text-ink">
        {WORKSPACE_LABELS[current]}
      </h1>

      {busy && (
        <span className="flex shrink-0 items-center gap-1.5 text-[13px] font-medium text-brand" role="status">
          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          Analyzing
        </span>
      )}
    </header>
  );
}
