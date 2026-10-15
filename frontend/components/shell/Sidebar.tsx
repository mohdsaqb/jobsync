"use client";

import { Briefcase, Check, FileText, MessageSquare, Sparkles, X } from "lucide-react";
import Logo from "@/components/Logo";
import { cn } from "@/lib/cn";
import type { Workspace } from "@/lib/workspace";

interface SidebarProps {
  current: Workspace;
  onNavigate: (workspace: Workspace) => void;
  /** Number of matched roles, or null before an analysis has run. */
  matchCount: number | null;
  hasResults: boolean;
  onClose?: () => void;
}

export default function Sidebar({ current, onNavigate, matchCount, hasResults, onClose }: SidebarProps) {
  const steps = [
    { id: "resume" as const, label: "Resume", icon: FileText, locked: false, done: hasResults },
    {
      id: "jobs" as const,
      label: "Matched jobs",
      icon: Briefcase,
      locked: !hasResults,
      count: matchCount,
    },
    { id: "suggestions" as const, label: "AI suggestions", icon: Sparkles, locked: !hasResults },
  ];

  return (
    <div className="flex h-full w-full flex-col bg-surface">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <Logo className="h-7 w-7 shrink-0 rounded-lg" />
        <p className="flex-1 text-[15px] font-semibold tracking-tight text-ink">JobSync</p>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-slate-100 hover:text-ink lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <nav aria-label="Workflow" className="flex-1 px-3">
        <ul className="space-y-1">
          {steps.map(({ id, label, icon: Icon, locked, done, count }) => {
            const active = current === id;
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => onNavigate(id)}
                  disabled={locked}
                  aria-current={active ? "page" : undefined}
                  title={locked ? "Upload a resume first" : undefined}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors",
                    active && "bg-brand-subtle text-brand",
                    !active && !locked && "text-slate-700 hover:bg-slate-50",
                    locked && "cursor-not-allowed text-muted opacity-60",
                  )}
                >
                  <Icon className={cn("h-4 w-4 shrink-0", active ? "text-brand" : "text-muted")} />
                  <span className="flex-1 truncate">{label}</span>
                  {done && <Check className="h-4 w-4 shrink-0 text-success" aria-label="Completed" />}
                  {count != null && !done && (
                    <span className="shrink-0 text-[13px] tabular-nums text-muted">{count.toLocaleString()}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-3">
        <a
          href="https://github.com/mohdsaqb/jobsync/issues"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-muted transition-colors hover:bg-slate-50 hover:text-ink"
        >
          <MessageSquare className="h-4 w-4 shrink-0" />
          Help &amp; feedback
        </a>
      </div>
    </div>
  );
}
