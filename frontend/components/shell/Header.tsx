"use client";

import { Menu, RefreshCw } from "lucide-react";
import { formatSyncAge } from "@/lib/jobMeta";
import type { AnalyzeMeta } from "@/lib/types";
import { WORKSPACE_LABELS, type Workspace } from "@/lib/workspace";

/**
 * Deliberately sparse: a breadcrumb, a genuine freshness read-out, and the
 * mobile menu trigger. No decorative bell or avatar — the app has no accounts.
 */
export default function Header({
  current,
  meta,
  busy,
  onOpenNav,
}: {
  current: Workspace;
  meta: AnalyzeMeta | null;
  /** True while an analysis is in flight. */
  busy: boolean;
  onOpenNav: () => void;
}) {
  const syncAge = formatSyncAge(meta?.lastSyncAt);

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

      <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
        <ol className="flex items-center gap-2 text-sm">
          <li className="hidden text-muted sm:block">JobSync</li>
          <li aria-hidden="true" className="hidden text-slate-300 sm:block">
            /
          </li>
          <li className="truncate font-medium text-ink" aria-current="page">
            {WORKSPACE_LABELS[current]}
          </li>
        </ol>
      </nav>

      <div className="flex shrink-0 items-center gap-3">
        {busy && (
          <span className="flex items-center gap-1.5 text-xs font-medium text-brand" role="status">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            <span className="hidden sm:inline">Analyzing</span>
          </span>
        )}
        {!busy && meta?.corpusSize != null && (
          <p className="hidden text-xs text-muted md:block">
            <span className="font-medium tabular-nums text-slate-600">{meta.corpusSize.toLocaleString()}</span> roles
            indexed
            {syncAge && <span className="text-slate-400"> · synced {syncAge}</span>}
          </p>
        )}
      </div>
    </header>
  );
}
