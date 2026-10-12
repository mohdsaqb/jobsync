"use client";

import { Banknote, Bookmark, BookmarkCheck, Building2, Clock, ExternalLink, MapPin } from "lucide-react";
import type { JobMatch } from "@/lib/types";
import { formatPostedAge, formatSalary } from "@/lib/jobMeta";
import { matchPercent, scoreTier } from "@/lib/scoreTier";
import { useJobActions } from "@/lib/useJobActions";
import { cn } from "@/lib/cn";

interface JobCardProps {
  match: JobMatch;
  onOpen: (match: JobMatch) => void;
}

export default function JobCard({ match, onOpen }: JobCardProps) {
  const { saved, toggleSaved, showApplyNote, handleApply } = useJobActions(match.jobId);
  const percent = matchPercent(match.score);
  const tier = scoreTier(match.score);
  const salary = formatSalary(match.salaryMin, match.salaryMax);
  const posted = formatPostedAge(match.createdAt);

  // The whole card is clickable, so these buttons must not bubble up to it.
  const stopAnd = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn();
  };

  return (
    <div
      onClick={() => onOpen(match)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onOpen(match);
      }}
      className="group flex h-full cursor-pointer flex-col rounded-2xl border border-white/10 bg-zinc-900/40 p-5 shadow-lg shadow-black/30 backdrop-blur-xl transition hover:border-white/20 hover:bg-zinc-900/60"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-zinc-50">{match.title}</h3>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-zinc-400">
            <Building2 className="h-3.5 w-3.5" />
            {match.company}
          </p>
        </div>
        <button
          type="button"
          onClick={stopAnd(toggleSaved)}
          aria-label={saved ? "Remove from saved jobs" : "Save job"}
          className="shrink-0 rounded-full p-1.5 text-zinc-400 transition hover:bg-white/10 hover:text-amber-300"
        >
          {saved ? <BookmarkCheck className="h-4 w-4 text-amber-300" /> : <Bookmark className="h-4 w-4" />}
        </button>
      </div>

      <span
        className={cn(
          "mt-3 inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1",
          tier.classes,
        )}
      >
        {percent}% &middot; {tier.label}
      </span>

      {(match.location || salary || posted) && (
        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
          {match.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {match.location}
            </span>
          )}
          {salary && (
            <span className="flex items-center gap-1">
              <Banknote className="h-3 w-3" />
              {salary}
            </span>
          )}
          {posted && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {posted}
            </span>
          )}
        </div>
      )}

      <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-zinc-400">{match.description}</p>

      <div className="mt-4 flex items-center gap-2">
        {match.url ? (
          <a
            href={match.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 rounded-lg bg-zinc-50 px-3.5 py-2 text-sm font-medium text-zinc-900 transition hover:bg-white"
          >
            Apply
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : (
          <button
            type="button"
            onClick={stopAnd(handleApply)}
            className="rounded-lg bg-zinc-50 px-3.5 py-2 text-sm font-medium text-zinc-900 transition hover:bg-white"
          >
            Apply
          </button>
        )}
        {showApplyNote && !match.url && (
          <span className="text-xs text-zinc-500">Demo posting — no apply link for this one.</span>
        )}
        <span className="ml-auto text-xs text-zinc-600 opacity-0 transition group-hover:opacity-100">
          Click for details
        </span>
      </div>
    </div>
  );
}
