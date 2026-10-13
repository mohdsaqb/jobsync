"use client";

import { Banknote, Bookmark, BookmarkCheck, Clock, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";
import { formatPostedAge, formatSalary } from "@/lib/jobMeta";
import { matchPercent, scoreTier } from "@/lib/scoreTier";
import type { JobMatch } from "@/lib/types";
import { useJobActions } from "@/lib/useJobActions";
import CompanyAvatar from "./CompanyAvatar";

export default function JobListItem({
  job,
  selected,
  onSelect,
}: {
  job: JobMatch;
  selected: boolean;
  onSelect: () => void;
}) {
  const { saved, toggleSaved } = useJobActions(job.jobId);
  const tier = scoreTier(job.score);
  const salary = formatSalary(job.salaryMin, job.salaryMax);
  const posted = formatPostedAge(job.createdAt);

  return (
    <div
      className={cn(
        "group relative rounded-xl border transition-colors",
        selected ? "border-brand bg-brand-subtle" : "border-hairline bg-surface hover:border-slate-300",
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-current={selected ? "true" : undefined}
        className="flex w-full items-start gap-3 rounded-xl p-4 text-left"
      >
        <CompanyAvatar company={job.company} />

        <span className="min-w-0 flex-1">
          <span className="flex items-start justify-between gap-2">
            <span className="min-w-0">
              <span className="block truncate text-[14.5px] font-semibold text-ink">{job.title}</span>
              <span className="mt-0.5 block truncate text-[13px] text-muted">{job.company}</span>
            </span>
            {/* Padded so the bookmark button never overlaps the score. */}
            <span className="shrink-0 pr-7">
              <Badge tone={tier.tone}>{matchPercent(job.score)}%</Badge>
            </span>
          </span>

          {(job.location || salary || posted) && (
            <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
              {job.location && (
                <span className="flex min-w-0 items-center gap-1">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">{job.location}</span>
                </span>
              )}
              {salary && (
                <span className="flex items-center gap-1">
                  <Banknote className="h-3 w-3 shrink-0" />
                  {salary}
                </span>
              )}
              {posted && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3 shrink-0" />
                  {posted}
                </span>
              )}
            </span>
          )}
        </span>
      </button>

      <button
        type="button"
        onClick={toggleSaved}
        aria-label={saved ? `Remove ${job.title} from saved jobs` : `Save ${job.title}`}
        aria-pressed={saved}
        className={cn(
          "absolute right-3 top-3 rounded-md p-1.5 transition-colors",
          saved ? "text-amber-500" : "text-slate-300 hover:bg-white hover:text-slate-500",
        )}
      >
        {saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
      </button>
    </div>
  );
}
