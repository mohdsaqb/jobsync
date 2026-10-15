"use client";

import { Banknote, Clock, ExternalLink, MapPin, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button, LinkButton } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { formatPostedAge, formatSalary } from "@/lib/jobMeta";
import { matchPercent, scoreTier } from "@/lib/scoreTier";
import type { JobMatch } from "@/lib/types";
import { useJobActions } from "@/lib/useJobActions";

export default function JobDetail({ job, onGetSuggestions }: { job: JobMatch; onGetSuggestions: () => void }) {
  const { saved, toggleSaved } = useJobActions(job.jobId);
  const tier = scoreTier(job.score);
  const salary = formatSalary(job.salaryMin, job.salaryMax);
  const posted = formatPostedAge(job.createdAt);
  const matched = job.matchedSkills ?? [];
  const unmatched = job.unmatchedSkills ?? [];

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-hairline px-5 py-5">
        <h2 className="text-lg font-semibold leading-snug text-ink">{job.title}</h2>
        <p className="mt-1 text-sm text-slate-700">{job.company}</p>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-muted">
          <Badge tone={tier.tone}>
            {matchPercent(job.score)}% · {tier.label}
          </Badge>
          {job.location && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {job.location}
            </span>
          )}
          {salary && (
            <span className="flex items-center gap-1.5">
              <Banknote className="h-3.5 w-3.5 shrink-0" />
              {salary}
            </span>
          )}
          {posted && (
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              {posted}
            </span>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {job.url && (
            <LinkButton
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              icon={<ExternalLink className="h-4 w-4" />}
            >
              Apply
            </LinkButton>
          )}
          <Button variant="secondary" onClick={onGetSuggestions} icon={<Sparkles className="h-4 w-4" />}>
            Get suggestions
          </Button>
          <Button variant="secondary" onClick={toggleSaved}>
            {saved ? "Saved" : "Save"}
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-slim px-5 py-5">
        {(matched.length > 0 || unmatched.length > 0) && (
          <div className="mb-5 space-y-3">
            {matched.length > 0 && (
              <div>
                <p className="text-[13px] font-medium text-muted">Skills you have</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {matched.map((skill) => (
                    <Badge key={skill} tone="brand">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {unmatched.length > 0 && (
              <div>
                <p className="text-[13px] font-medium text-muted">Not in your resume</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {unmatched.map((skill) => (
                    <Badge key={skill} tone="warning">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{job.description}</p>
      </div>
    </div>
  );
}

/** Shown in the right pane before anything is selected. */
export function JobDetailPlaceholder({ className }: { className?: string }) {
  return (
    <div className={cn("flex h-full items-center justify-center px-6 text-center", className)}>
      <p className="text-sm text-muted">Select a job to see the details.</p>
    </div>
  );
}
