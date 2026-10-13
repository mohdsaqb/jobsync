"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, FileText, RotateCcw, Search, SlidersHorizontal, X } from "lucide-react";
import JobDetail, { JobDetailPlaceholder } from "@/components/jobs/JobDetail";
import JobListItem from "@/components/jobs/JobListItem";
import PageHeading from "@/components/shell/PageHeading";
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
import { formatSyncAge } from "@/lib/jobMeta";
import type { AnalyzeMeta, JobMatch } from "@/lib/types";

const PAGE_SIZE = 25;

export default function JobsWorkspace({
  matches,
  meta,
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
  meta: AnalyzeMeta | null;
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
  const [filtersOpen, setFiltersOpen] = useState(false);

  const results = useMemo(() => applyJobFilters(matches ?? [], filters), [matches, filters]);
  const locations = useMemo(() => locationOptions(matches ?? []), [matches]);
  const filtersActive = hasActiveFilters(filters);

  // A narrowed list shouldn't keep yesterday's scroll depth.
  useEffect(() => setVisible(PAGE_SIZE), [filters, matches]);

  const selected = results.find((job) => job.jobId === selectedJobId) ?? null;
  const update = <K extends keyof JobFilters>(key: K, value: JobFilters[K]) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  if (loading) return <JobsSkeleton />;

  if (error) {
    return (
      <Shell>
        <Heading matches={null} meta={meta} />
        <Alert tone="error" title="We couldn't retrieve matching jobs" className="mt-8" action={
          <Button size="sm" variant="secondary" onClick={onRetry} icon={<RotateCcw className="h-3.5 w-3.5" />}>
            Retry
          </Button>
        }>
          {error}
        </Alert>
      </Shell>
    );
  }

  if (!matches) {
    return (
      <Shell>
        <Heading matches={null} meta={meta} />
        <Card className="mt-8">
          <EmptyState
            icon={<FileText className="h-5 w-5" />}
            title="Upload a resume first"
            description="Job matching works from the skills and experience in your resume, so there's nothing to match against yet."
            action={
              <Button onClick={onGoToResume} icon={<ArrowLeft className="h-4 w-4" />}>
                Go to resume upload
              </Button>
            }
          />
        </Card>
      </Shell>
    );
  }

  return (
    <Shell>
      <Heading matches={matches} meta={meta} resultCount={results.length} filtersActive={filtersActive} />

      <Card className="mt-6 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <TextInput
            className="min-w-[200px] flex-1"
            placeholder="Search job title or company"
            aria-label="Search job title or company"
            adornment={<Search className="h-4 w-4" />}
            value={filters.query}
            onChange={(e) => update("query", e.target.value)}
          />
          <Button
            variant="secondary"
            onClick={() => setFiltersOpen((open) => !open)}
            aria-expanded={filtersOpen}
            icon={<SlidersHorizontal className="h-4 w-4" />}
            className="sm:hidden"
          >
            Filters
          </Button>
          <div className={cn("w-full gap-2 sm:flex sm:w-auto", filtersOpen ? "flex flex-wrap" : "hidden")}>
            <TextInput
              className="min-w-[160px] flex-1"
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
            <Select
              aria-label="Filter by date posted"
              className="min-w-[132px]"
              value={filters.postedWithin}
              onChange={(e) => update("postedWithin", e.target.value as PostedWithin)}
              options={[
                { value: "any", label: "Any date" },
                { value: "7", label: "Past week" },
                { value: "30", label: "Past month" },
                { value: "90", label: "Past 3 months" },
              ]}
            />
            <Select
              aria-label="Sort results"
              className="min-w-[132px]"
              value={filters.sort}
              onChange={(e) => update("sort", e.target.value as SortKey)}
              options={[
                { value: "match", label: "Best match" },
                { value: "newest", label: "Newest first" },
              ]}
            />
            <label className="flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-hairline px-3 text-[13px] text-slate-600 transition-colors hover:border-slate-300">
              <input
                type="checkbox"
                checked={filters.salaryOnly}
                onChange={(e) => update("salaryOnly", e.target.checked)}
                className="h-3.5 w-3.5 rounded border-slate-300 text-brand focus:ring-brand/30"
              />
              Salary listed
            </label>
            {filtersActive && (
              <Button variant="ghost" onClick={() => setFilters(EMPTY_FILTERS)} icon={<X className="h-4 w-4" />}>
                Clear
              </Button>
            )}
          </div>
        </div>
      </Card>

      {results.length === 0 ? (
        <Card className="mt-6">
          <EmptyState
            icon={<Search className="h-5 w-5" />}
            title={filtersActive ? "No roles match these filters" : "No matching roles found"}
            description={
              filtersActive
                ? "Try widening the date range or clearing the location to see more of your matches."
                : "Your resume didn't match any indexed role above the relevance threshold."
            }
            action={
              filtersActive ? (
                <Button variant="secondary" onClick={() => setFilters(EMPTY_FILTERS)}>
                  Clear filters
                </Button>
              ) : (
                <Button variant="secondary" onClick={onGoToResume}>
                  Try a different resume
                </Button>
              )
            }
          />
        </Card>
      ) : (
        <div className="mt-6 grid min-h-0 gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
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
              <Button
                variant="secondary"
                className="mt-3 w-full"
                onClick={() => setVisible((n) => n + PAGE_SIZE)}
              >
                Show {Math.min(PAGE_SIZE, results.length - visible)} more
                <span className="text-muted">
                  ({visible.toLocaleString()} of {results.length.toLocaleString()})
                </span>
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
                Back to results
              </Button>
            )}
            <Card className="lg:sticky lg:top-0 lg:max-h-[calc(100dvh-13rem)] lg:overflow-hidden">
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
  return <div className="mx-auto max-w-workspace px-4 py-8 sm:px-6 lg:px-8">{children}</div>;
}

function Heading({
  matches,
  meta,
  resultCount,
  filtersActive,
}: {
  matches: JobMatch[] | null;
  meta: AnalyzeMeta | null;
  resultCount?: number;
  filtersActive?: boolean;
}) {
  const syncAge = formatSyncAge(meta?.lastSyncAt);
  const total = matches?.length;

  return (
    <PageHeading
      eyebrow="Workspace / Opportunities"
      title="Jobs matched to your profile"
      description={
        <>
          Explore relevant roles based on your resume, skills, and experience.
          {total != null && (
            <>
              {" "}
              <span className="text-slate-600">
                {filtersActive && resultCount !== total
                  ? `Showing ${resultCount?.toLocaleString()} of ${total.toLocaleString()} matches.`
                  : `${total.toLocaleString()} ${total === 1 ? "match" : "matches"}.`}
              </span>
              {syncAge && <span className="text-slate-400"> Corpus synced {syncAge}.</span>}
            </>
          )}
        </>
      }
    />
  );
}

function JobsSkeleton() {
  return (
    <Shell>
      <Heading matches={null} meta={null} />
      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
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
