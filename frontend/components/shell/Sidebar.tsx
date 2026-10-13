"use client";

import { AlertCircle, Briefcase, Check, FileText, MessageSquare, Sparkles, X } from "lucide-react";
import Logo from "@/components/Logo";
import { cn } from "@/lib/cn";
import type { StepStatus, Workspace } from "@/lib/workspace";

interface SidebarProps {
  current: Workspace;
  onNavigate: (workspace: Workspace) => void;
  /** Number of matched roles, or null before an analysis has run. */
  matchCount: number | null;
  selectedJobTitle: string | null;
  hasResults: boolean;
  resumeFailed: boolean;
  /** Present only in the mobile drawer. */
  onClose?: () => void;
}

interface Step {
  id: Workspace;
  index: string;
  label: string;
  hint: string;
  icon: typeof FileText;
  status: StepStatus;
  /** Shown on the right — a real count or job name, never a decorative tick. */
  trailing?: string;
}

export default function Sidebar({
  current,
  onNavigate,
  matchCount,
  selectedJobTitle,
  hasResults,
  resumeFailed,
  onClose,
}: SidebarProps) {
  const statusFor = (id: Workspace, done: boolean, locked: boolean): StepStatus => {
    if (id === "resume" && resumeFailed) return "attention";
    if (current === id) return "active";
    if (locked) return "locked";
    return done ? "done" : "todo";
  };

  const steps: Step[] = [
    {
      id: "resume",
      index: "01",
      label: "Resume",
      hint: "Build your profile",
      icon: FileText,
      status: statusFor("resume", hasResults, false),
    },
    {
      id: "jobs",
      index: "02",
      label: "Matched Jobs",
      hint: "Discover opportunities",
      icon: Briefcase,
      status: statusFor("jobs", false, !hasResults),
      trailing: matchCount !== null ? matchCount.toLocaleString() : undefined,
    },
    {
      id: "suggestions",
      index: "03",
      label: "AI Suggestions",
      hint: selectedJobTitle ?? "Improve your application",
      icon: Sparkles,
      status: statusFor("suggestions", false, !hasResults),
    },
  ];

  return (
    <div className="flex h-full w-full flex-col bg-surface">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <Logo className="h-8 w-8 shrink-0 rounded-lg" />
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold leading-none tracking-tight text-ink">JobSync</p>
          <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-slate-400">AI Career Workspace</p>
        </div>
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

      <nav aria-label="Workflow" className="flex-1 overflow-y-auto px-3">
        <p className="px-2 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Workflow</p>
        <ul className="space-y-1">
          {steps.map((step) => (
            <li key={step.id}>
              <StepButton step={step} onClick={() => onNavigate(step.id)} />
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-hairline p-3">
        <a
          href="https://github.com/mohdsaqb/jobsync/issues"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-muted transition-colors hover:bg-slate-50 hover:text-ink"
        >
          <MessageSquare className="h-4 w-4 shrink-0" />
          Help &amp; feedback
        </a>
      </div>
    </div>
  );
}

function StepButton({ step, onClick }: { step: Step; onClick: () => void }) {
  const { icon: Icon, status } = step;
  const isActive = status === "active";
  const isLocked = status === "locked";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLocked}
      aria-current={isActive ? "page" : undefined}
      title={isLocked ? "Upload a resume first" : undefined}
      className={cn(
        "group flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition-colors",
        isActive && "bg-brand-subtle",
        !isActive && !isLocked && "hover:bg-slate-50",
        isLocked && "cursor-not-allowed opacity-55",
      )}
    >
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors",
          isActive ? "border-indigo-200 bg-white text-brand" : "border-hairline bg-slate-50 text-slate-500",
          status === "attention" && "border-red-200 bg-red-50 text-danger",
        )}
      >
        <Icon className="h-4 w-4" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold tabular-nums text-slate-400">{step.index}</span>
          <span className={cn("truncate text-[13.5px] font-medium", isActive ? "text-brand" : "text-ink")}>
            {step.label}
          </span>
        </span>
        <span className="mt-0.5 block truncate text-[11.5px] text-muted">{step.hint}</span>
      </span>

      {step.status === "done" && (
        <span className="shrink-0 text-success" title="Completed">
          <Check className="h-4 w-4" />
          <span className="sr-only">Completed</span>
        </span>
      )}
      {step.status === "attention" && (
        <span className="shrink-0 text-danger" title="Needs attention">
          <AlertCircle className="h-4 w-4" />
          <span className="sr-only">Needs attention</span>
        </span>
      )}
      {step.trailing && step.status !== "done" && step.status !== "attention" && (
        <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-slate-600">
          {step.trailing}
        </span>
      )}
    </button>
  );
}
