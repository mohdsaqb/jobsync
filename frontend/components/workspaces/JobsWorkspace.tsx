"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import JobDetail, { JobDetailPlaceholder } from "@/components/jobs/JobDetail";
import JobListItem from "@/components/jobs/JobListItem";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Select, TextInput } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/EmptyState";
import { JobCardSkeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";
import {
  applyJobFilters,
  EMPTY_FILTERS,
  hasActiveFilters,
  locationOptions,
  type JobFilters,
  type PostedWithin,
  type SortKey,
} from "@/lib/jobFilters";
import type { JobMatch } from "@/lib/types";

const PAGE_SIZE = 25;

export default function JobsWorkspace({
  matches,
  loading,
  error,
  selectedJobId,
  onSelectJob,
  onGetSuggestions,
  onGoToResume,
  onRetry,
}: {
  /** Null until an analysis has run. */
  matches: JobMatch[] | null;
  loading: boolean;
  error: string | null;
  selectedJobId: string | null;
  onSelectJob: (jobId: string | null) => void;
  onGetSuggestions: () => void;
  onGoToResume: () => void;
  onRetry: () => void;
}) {
  const [filters, setFilters] = useState<JobFilters>(EMPTY_FILTERS);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [moreOpen, setMoreOpen] = useState(false);

  const results = useMemo(() => applyJobFilters(matches ?? [], filters), [matches, filters]);
  const locations = useMemo(() => locationOptions(matches ?? []), [matches]);
  const filtersActive = hasActiveFilters(filters);

  // Only offer a filter the data can answer. The synthetic corpus carries no
  // location, date or salary, and a control that always returns nothing reads
  // as a broken app rather than an empty result.
  const canFilterLocation = locations.length > 0;
  const canFilterDate = useMemo(() => (matches ?? []).some((job) => (job.createdAt ?? 0) > 0), [matches]);
  const canFilterSalary = useMemo(
    () => (matches ?? []).some((job) => (job.salaryMin ?? 0) > 0 || (job.salaryMax ?? 0) > 0),
    [matches],
  );
  const hasSecondaryFilters = canFilterDate || canFilterSalary;

  // A narrowed list shouldn't keep the previous scroll depth.
  useEffect(() => setVisible(PAGE_SIZE), [filters, matches]);

  const selected = results.find((job) => job.jobId === selectedJobId) ?? null;
  const update = <K extends keyof JobFilters>(key: K, value: JobFilters[K]) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  if (loading) {
    return (
      <Shell>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <div className="space-y-2.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <JobCardSkeleton key={i} />
            ))}
          </div>
          <Card className="hidden min-h-[320px] lg:block" />
        </div>
      </Shell>
    );
  }

  if (error) {
    return (
      <Shell>
        <Alert
          tone="error"
          action={
            <Button size="sm" variant="secondary" onClick={onRetry} icon={<RotateCcw className="h-3.5 w-3.5" />}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Shell>
    );
  }

  if (!matches) {
    return (
      <Shell>
        <Card>
          <EmptyState
            title="No resume yet"
            description="Upload a resume to see roles that match it."
            action={<Button onClick={onGoToResume}>Upload resume</Button>}
          />
        </Card>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="flex flex-wrap items-center gap-2">
        <TextInput
          className="min-w-[200px] flex-1"
          placeholder="Search by title or company"
          aria-label="Search by title or company"
          adornment={<Search className="h-4 w-4" />}
          value={filters.query}
          onChange={(e) => update("query", e.target.value)}
        />
        {canFilterLocation && (
          <>
            <TextInput
              className="min-w-[160px] flex-1 sm:max-w-[200px]"
              placeholder="Any location"
              aria-label="Filter by location"
              list="job-locations"
              value={filters.location}
              onChange={(e) => update("location", e.target.value)}
            />
            <datalist id="job-locations">
              {locations.map((value) => (
                <option key={value} value={value} />
              ))}
            </datalist>
          </>
        )}
        <Button
          variant={moreOpen || filtersActive ? "secondary" : "ghost"}
          onClick={() => setMoreOpen((open) => !open)}
          aria-expanded={moreOpen}
          icon={<SlidersHorizontal className="h-4 w-4" />}
        >
          Filters
        </Button>
      </div>

      {moreOpen && (
        <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-hairline bg-surface p-2.5">
          <Select
            aria-label="Sort results"
            className="min-w-[140px]"
            value={filters.sort}
            onChange={(e) => update("sort", e.target.value as SortKey)}
            options={
              canFilterDate
                ? [
                    { value: "match", label: "Best match" },
                    { value: "newest", label: "Newest first" },
                  ]
                : [{ value: "match", label: "Best match" }]
            }
          />
          {canFilterDate && (
          <Select
            aria-label="Filter by date posted"
            className="min-w-[140px]"
            value={filters.postedWithin}
            onChange={(e) => update("postedWithin", e.target.value as PostedWithin)}
            options={[
              { value: "any", label: "Any date" },
              { value: "7", label: "Past week" },
              { value: "30", label: "Past month" },
              { value: "90", label: "Past 3 months" },
            ]}
          />
          )}
          {canFilterSalary && (
          <label className="flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-hairline px-3 text-[13px] text-slate-700">
            <input
              type="checkbox"
              checked={filters.salaryOnly}
              onChange={(e) => update("salaryOnly", e.target.checked)}
              className="h-3.5 w-3.5 rounded border-slate-300 text-brand focus:ring-brand/30"
            />
            Salary listed
          </label>
          )}
          {filtersActive && (
            <Button variant="ghost" onClick={() => setFilters(EMPTY_FILTERS)}>
              Clear
            </Button>
          )}
        </div>
      )}

      <p className="mt-4 text-[13px] text-muted">
        {results.length.toLocaleString()} {results.length === 1 ? "job" : "jobs"}
        {filtersActive && results.length !== matches.length && ` of ${matches.length.toLocaleString()}`}
      </p>

      {results.length === 0 ? (
        <Card className="mt-3">
          <EmptyState
            title="No jobs found"
            description={filtersActive ? "Try clearing your filters." : "No roles matched your resume closely enough."}
            action={
              filtersActive ? (
                <Button variant="secondary" onClick={() => setFilters(EMPTY_FILTERS)}>
                  Clear filters
                </Button>
              ) : (
                <Button variant="secondary" onClick={onGoToResume}>
                  Try another resume
                </Button>
              )
            }
          />
        </Card>
      ) : (
        <div className="mt-3 grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <div className={cn("min-w-0", selected && "hidden lg:block")}>
            <ul className="space-y-2.5">
              {results.slice(0, visible).map((job) => (
                <li key={job.jobId}>
                  <JobListItem
                    job={job}
                    selected={job.jobId === selectedJobId}
                    onSelect={() => onSelectJob(job.jobId)}
                  />
                </li>
              ))}
            </ul>
            {visible < results.length && (
              <Button variant="secondary" className="mt-3 w-full" onClick={() => setVisible((n) => n + PAGE_SIZE)}>
                Show more
              </Button>
            )}
          </div>

          <div className="min-w-0">
            {selected && (
              <Button
                variant="ghost"
                size="sm"
                className="mb-2 lg:hidden"
                onClick={() => onSelectJob(null)}
                icon={<ArrowLeft className="h-4 w-4" />}
              >
                Back
              </Button>
            )}
            <Card className="lg:sticky lg:top-0 lg:max-h-[calc(100dvh-10rem)] lg:overflow-hidden">
              {selected ? (
                <JobDetail job={selected} onGetSuggestions={onGetSuggestions} />
              ) : (
                <JobDetailPlaceholder className="min-h-[320px]" />
              )}
            </Card>
          </div>
        </div>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-workspace px-4 py-6 sm:px-6 lg:px-8">{children}</div>;
}
