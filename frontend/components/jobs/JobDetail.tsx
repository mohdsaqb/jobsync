"use client";

import { Banknote, Check, Clock, ExternalLink, HelpCircle, MapPin, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button, LinkButton } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { formatPostedAge, formatSalary } from "@/lib/jobMeta";
import { matchPercent, scoreTier } from "@/lib/scoreTier";
import type { JobMatch } from "@/lib/types";
import { useJobActions } from "@/lib/useJobActions";
import CompanyAvatar from "./CompanyAvatar";

export default function JobDetail({
  job,
  onGetSuggestions,
}: {
  job: JobMatch;
  onGetSuggestions: () => void;
}) {
  const { saved, toggleSaved, showApplyNote, handleApply } = useJobActions(job.jobId);
  const tier = scoreTier(job.score);
  const salary = formatSalary(job.salaryMin, job.salaryMax);
  const posted = formatPostedAge(job.createdAt);
  const matched = job.matchedSkills ?? [];
  const unmatched = job.unmatchedSkills ?? [];

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-hairline px-5 py-5">
        <div className="flex items-start gap-3">
          <CompanyAvatar company={job.company} className="h-10 w-10 text-xs" />
          <div className="min-w-0 flex-1">
            <h2 className="text-[17px] font-semibold leading-snug text-ink">{job.title}</h2>
            <p className="mt-0.5 text-sm text-muted">{job.company}</p>
          </div>
          <Badge tone={tier.tone} className="mt-0.5 shrink-0">
            {matchPercent(job.score)}% · {tier.label}
          </Badge>
        </div>

        {(job.location || salary || posted) && (
          <dl className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px]">
            {job.location && (
              <div className="flex items-center gap-1.5">
                <dt className="sr-only">Location</dt>
                <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <dd className="text-slate-600">{job.location}</dd>
              </div>
            )}
            {salary && (
              <div className="flex items-center gap-1.5">
                <dt className="sr-only">Salary</dt>
                <Banknote className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <dd className="text-slate-600">{salary} per year</dd>
              </div>
            )}
            {posted && (
              <div className="flex items-center gap-1.5">
                <dt className="sr-only">Posted</dt>
                <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <dd className="text-slate-600">Posted {posted}</dd>
              </div>
            )}
          </dl>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {job.url ? (
            <LinkButton href={job.url} target="_blank" rel="noopener noreferrer" icon={<ExternalLink className="h-4 w-4" />}>
              Apply on company site
            </LinkButton>
          ) : (
            <Button onClick={handleApply}>Apply</Button>
          )}
          <Button variant="secondary" onClick={onGetSuggestions} icon={<Sparkles className="h-4 w-4" />}>
            Get AI suggestions
          </Button>
          <Button variant="secondary" onClick={toggleSaved}>
            {saved ? "Saved" : "Save"}
          </Button>
        </div>
        {showApplyNote && !job.url && (
          <p className="mt-2 text-xs text-muted">This posting has no application link attached.</p>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-slim px-5 py-5">
        {(matched.length > 0 || unmatched.length > 0) && (
          <section className="mb-6">
            <h3 className="text-[13px] font-semibold text-ink">Why this matched</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              Skills this posting mentions, compared against the ones detected in your resume. The overall score also
              weighs how closely the two documents read overall.
            </p>

            {matched.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-medium text-slate-600">
                  In your resume
                  <span className="ml-1 tabular-nums text-muted">({matched.length})</span>
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {matched.map((skill) => (
                    <Badge key={skill} tone="brand" icon={<Check className="h-3 w-3" />}>
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {unmatched.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-medium text-slate-600">
                  Not evident in your resume
                  <span className="ml-1 tabular-nums text-muted">({unmatched.length})</span>
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {unmatched.map((skill) => (
                    <Badge key={skill} tone="neutral" icon={<HelpCircle className="h-3 w-3" />}>
                      {skill}
                    </Badge>
                  ))}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted">
                  Detected by keyword, so something you have may simply be worded differently — worth a look rather
                  than treating as a definite gap.
                </p>
              </div>
            )}
          </section>
        )}

        <section>
          <h3 className="text-[13px] font-semibold text-ink">Role description</h3>
          <p className="mt-2 whitespace-pre-line text-[13.5px] leading-relaxed text-slate-700">{job.description}</p>
        </section>
      </div>
    </div>
  );
}

/** Shown in the right pane before anything is selected. */
export function JobDetailPlaceholder({ className }: { className?: string }) {
  return (
    <div className={cn("flex h-full flex-col items-center justify-center px-6 text-center", className)}>
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
        <Sparkles className="h-5 w-5" />
      </span>
      <p className="mt-3 text-sm font-semibold text-ink">Select a role</p>
      <p className="mt-1 max-w-xs text-[13px] leading-relaxed text-muted">
        Pick a job from the list to see the full description, how it matches your resume, and where to apply.
      </p>
    </div>
  );
}
