"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Briefcase,
  Check,
  CheckCircle2,
  Copy,
  HelpCircle,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import PageHeading from "@/components/shell/PageHeading";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { TextInput } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";
import { emphasisParts, itemToPlainText, parseSuggestions, type SuggestionItem } from "@/lib/suggestionFormat";
import type { JobMatch } from "@/lib/types";

export default function SuggestionsWorkspace({
  job,
  hasResults,
  suggestions,
  generatingFor,
  error,
  onGenerate,
  onGoToJobs,
  onGoToResume,
}: {
  /** The job these recommendations are about, if one was selected. */
  job: JobMatch | null;
  hasResults: boolean;
  /** Raw model output for `generatedFor`, or null before generating. */
  suggestions: { text: string; forLabel: string } | null;
  /** Role label currently being generated, or null when idle. */
  generatingFor: string | null;
  error: string | null;
  onGenerate: (role: string) => void;
  onGoToJobs: () => void;
  onGoToResume: () => void;
}) {
  const [role, setRole] = useState(job?.title ?? "");
  const [reviewed, setReviewed] = useState<Set<string>>(new Set());

  // Recommendations are role-specific, so switching jobs must not leave the
  // previous role's text on screen looking like it applies to the new one.
  useEffect(() => {
    if (job?.title) setRole(job.title);
    setReviewed(new Set());
  }, [job?.jobId, job?.title]);

  if (!hasResults) {
    return (
      <Shell>
        <Heading />
        <Card className="mt-8">
          <EmptyState
            icon={<Sparkles className="h-5 w-5" />}
            title="Upload a resume first"
            description="Recommendations are based on your resume and a role you're targeting, so there's nothing to work from yet."
            action={<Button onClick={onGoToResume}>Go to resume upload</Button>}
          />
        </Card>
      </Shell>
    );
  }

  const busy = generatingFor !== null;
  const stale = suggestions !== null && suggestions.forLabel !== role.trim();
  const items = suggestions && !stale ? parseSuggestions(suggestions.text) : [];

  return (
    <Shell>
      <Heading />

      <div className="mt-6 space-y-5">
        <Card className="p-4">
          {job ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-subtle text-brand">
                  <Briefcase className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{job.title}</p>
                  <p className="truncate text-[13px] text-muted">
                    {job.company}
                    {job.location && ` · ${job.location}`}
                  </p>
                </div>
              </div>
              <Button variant="secondary" size="sm" onClick={onGoToJobs} icon={<ArrowLeft className="h-3.5 w-3.5" />}>
                Change job
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap items-end gap-3">
              <TextInput
                className="min-w-[220px] flex-1"
                label="Role you're targeting"
                placeholder="e.g. Staff Frontend Engineer"
                value={role}
                maxLength={200}
                disabled={busy}
                onChange={(e) => setRole(e.target.value)}
                hint="Or pick a job from your matches to use its title automatically."
              />
              <Button variant="secondary" size="sm" onClick={onGoToJobs}>
                Browse matches
              </Button>
            </div>
          )}
        </Card>

        {error && (
          <Alert
            tone="error"
            title="We couldn't generate recommendations"
            action={
              <Button size="sm" variant="secondary" onClick={() => onGenerate(role)} icon={<RotateCcw className="h-3.5 w-3.5" />}>
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        {/* Section 1 — the model's output */}
        <Card>
          <CardHeader
            title="Resume improvements"
            description={
              job
                ? `Targeted at the title "${job.title}". The model sees your resume text and that title.`
                : "Based on your resume and the role you name above."
            }
            action={
              <Button
                size="sm"
                onClick={() => onGenerate(role)}
                disabled={!role.trim()}
                loading={busy}
                icon={!busy ? <Sparkles className="h-3.5 w-3.5" /> : undefined}
              >
                {busy ? "Generating…" : items.length > 0 ? "Regenerate" : "Generate"}
              </Button>
            }
          />

          <div className="p-5">
            {busy && <GeneratingSkeleton />}

            {!busy && items.length === 0 && !error && (
              <EmptyState
                icon={<Sparkles className="h-5 w-5" />}
                title={stale ? "Role changed" : "Ready to generate"}
                description={
                  stale
                    ? "The role changed since these recommendations were produced. Generate again to get advice for the new one."
                    : "We'll compare your resume against this role and suggest specific changes."
                }
                className="py-10"
              />
            )}

            {!busy && items.length > 0 && (
              <ol className="space-y-3">
                {items.map((item, i) => (
                  <li key={item.id}>
                    <SuggestionCard
                      item={item}
                      index={i + 1}
                      reviewed={reviewed.has(item.id)}
                      onToggleReviewed={() =>
                        setReviewed((prev) => {
                          const next = new Set(prev);
                          next.has(item.id) ? next.delete(item.id) : next.add(item.id);
                          return next;
                        })
                      }
                    />
                  </li>
                ))}
              </ol>
            )}
          </div>
        </Card>

        {/* Section 2 — real per-job skill data, not model output */}
        {job && <SkillComparison job={job} />}
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>;
}

function Heading() {
  return (
    <PageHeading
      eyebrow="Workspace / AI assistant"
      title="Improve your application"
      description="Get targeted recommendations based on your resume and the selected job."
    />
  );
}

function GeneratingSkeleton() {
  return (
    <div className="space-y-3" role="status" aria-label="Generating recommendations">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-hairline p-4">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="mt-2.5 h-3 w-full" />
          <Skeleton className="mt-1.5 h-3 w-4/5" />
        </div>
      ))}
    </div>
  );
}

function SuggestionCard({
  item,
  index,
  reviewed,
  onToggleReviewed,
}: {
  item: SuggestionItem;
  index: number;
  reviewed: boolean;
  onToggleReviewed: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(itemToPlainText(item));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard can be blocked by permissions; the text stays selectable.
    }
  };

  return (
    <div
      className={cn(
        "rounded-lg border p-4 transition-colors",
        reviewed ? "border-hairline bg-slate-50/70" : "border-hairline bg-surface",
      )}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-brand-subtle text-[11px] font-semibold tabular-nums text-brand">
          {index}
        </span>
        <div className={cn("min-w-0 flex-1", reviewed && "opacity-60")}>
          {item.heading && <p className="text-[13.5px] font-semibold text-ink">{item.heading}</p>}
          {item.body && (
            <p className={cn("text-[13.5px] leading-relaxed text-slate-700", item.heading && "mt-1")}>
              {emphasisParts(item.body).map((part, i) =>
                part.bold ? (
                  <strong key={i} className="font-semibold text-ink">
                    {part.text}
                  </strong>
                ) : (
                  <span key={i}>{part.text}</span>
                ),
              )}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1 pl-8">
        <Button variant="ghost" size="sm" onClick={copy} icon={<Copy className="h-3.5 w-3.5" />}>
          {copied ? "Copied" : "Copy"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleReviewed}
          aria-pressed={reviewed}
          icon={reviewed ? <CheckCircle2 className="h-3.5 w-3.5 text-success" /> : <Check className="h-3.5 w-3.5" />}
        >
          {reviewed ? "Reviewed" : "Mark reviewed"}
        </Button>
      </div>
    </div>
  );
}

function SkillComparison({ job }: { job: JobMatch }) {
  const matched = job.matchedSkills ?? [];
  const unmatched = job.unmatchedSkills ?? [];

  if (matched.length === 0 && unmatched.length === 0) {
    return (
      <Card>
        <CardHeader title="Skills and role requirements" />
        <div className="p-5">
          <p className="text-[13px] leading-relaxed text-muted">
            We didn&apos;t recognise any of our tracked skills in this posting, so there&apos;s nothing to compare
            against your resume here. The match score still reflects how closely the two documents read overall.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Skills and role requirements"
        description="Matched by keyword against this posting and your resume — not model output."
      />
      <div className="grid gap-5 p-5 sm:grid-cols-2">
        <div>
          <p className="flex items-center gap-1.5 text-[13px] font-semibold text-ink">
            <Check className="h-3.5 w-3.5 text-success" />
            Supported by your resume
            <span className="font-normal tabular-nums text-muted">({matched.length})</span>
          </p>
          {matched.length > 0 ? (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {matched.map((skill) => (
                <Badge key={skill} tone="brand">
                  {skill}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-[13px] text-muted">None of this role&apos;s tracked skills appear in your resume.</p>
          )}
        </div>

        <div>
          <p className="flex items-center gap-1.5 text-[13px] font-semibold text-ink">
            <HelpCircle className="h-3.5 w-3.5 text-warning" />
            Worth reviewing
            <span className="font-normal tabular-nums text-muted">({unmatched.length})</span>
          </p>
          {unmatched.length > 0 ? (
            <>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {unmatched.map((skill) => (
                  <Badge key={skill} tone="warning">
                    {skill}
                  </Badge>
                ))}
              </div>
              <p className="mt-2.5 text-xs leading-relaxed text-muted">
                Detected by keyword only. If you have one of these worded differently, making it explicit is usually
                the quickest win.
              </p>
            </>
          ) : (
            <p className="mt-2 text-[13px] text-muted">
              Every tracked skill in this posting already appears in your resume.
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
