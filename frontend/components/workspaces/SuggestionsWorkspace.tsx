"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Check, Copy, RotateCcw, Sparkles } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
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
  /** Raw model output plus the role it was generated for. */
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

  // Advice is role-specific, so switching jobs must not leave the previous
  // role's text on screen looking like it applies to the new one.
  useEffect(() => {
    if (job?.title) setRole(job.title);
    setReviewed(new Set());
  }, [job?.jobId, job?.title]);

  if (!hasResults) {
    return (
      <Shell>
        <Card>
          <EmptyState
            title="No resume yet"
            description="Upload a resume to get suggestions for a role."
            action={<Button onClick={onGoToResume}>Upload resume</Button>}
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
      <Card className="p-4">
        {job ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{job.title}</p>
              <p className="truncate text-[13px] text-muted">{job.company}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button variant="secondary" size="sm" onClick={onGoToJobs} icon={<ArrowLeft className="h-3.5 w-3.5" />}>
                Change
              </Button>
              <Button
                size="sm"
                onClick={() => onGenerate(role)}
                loading={busy}
                icon={!busy ? <Sparkles className="h-3.5 w-3.5" /> : undefined}
              >
                {items.length > 0 ? "Regenerate" : "Generate"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-end gap-2">
            <TextInput
              className="min-w-[200px] flex-1"
              label="Role you're targeting"
              placeholder="Staff Frontend Engineer"
              value={role}
              maxLength={200}
              disabled={busy}
              onChange={(e) => setRole(e.target.value)}
            />
            <Button
              onClick={() => onGenerate(role)}
              disabled={!role.trim()}
              loading={busy}
              icon={!busy ? <Sparkles className="h-4 w-4" /> : undefined}
            >
              Generate
            </Button>
          </div>
        )}
      </Card>

      {error && (
        <Alert
          tone="error"
          className="mt-4"
          action={
            <Button size="sm" variant="secondary" onClick={() => onGenerate(role)} icon={<RotateCcw className="h-3.5 w-3.5" />}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {busy && (
        <div className="mt-4 space-y-2.5" role="status" aria-label="Generating suggestions">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="mt-2.5 h-3.5 w-full" />
              <Skeleton className="mt-1.5 h-3.5 w-4/5" />
            </Card>
          ))}
        </div>
      )}

      {!busy && items.length === 0 && !error && (
        <Card className="mt-4">
          <EmptyState
            title={stale ? "Role changed" : "No suggestions yet"}
            description={
              stale
                ? "Generate again for the new role."
                : "Generate targeted suggestions for this role."
            }
          />
        </Card>
      )}

      {!busy && items.length > 0 && (
        <ol className="mt-4 space-y-2.5">
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

      {job && <SkillLists job={job} />}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">{children}</div>;
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
      // Clipboard access can be blocked; the text stays selectable.
    }
  };

  return (
    <Card className={cn("p-4", reviewed && "bg-slate-50")}>
      <div className={cn("flex gap-3", reviewed && "opacity-55")}>
        <span className="mt-0.5 text-[13px] font-semibold tabular-nums text-muted">{index}</span>
        <div className="min-w-0 flex-1">
          {item.heading && <p className="text-sm font-semibold text-ink">{item.heading}</p>}
          {item.body && (
            <p className={cn("text-sm leading-relaxed text-slate-700", item.heading && "mt-1")}>
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

      <div className="mt-2.5 flex gap-1 pl-6">
        <Button variant="ghost" size="sm" onClick={copy} icon={<Copy className="h-3.5 w-3.5" />}>
          {copied ? "Copied" : "Copy"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleReviewed}
          aria-pressed={reviewed}
          icon={<Check className={cn("h-3.5 w-3.5", reviewed && "text-success")} />}
        >
          {reviewed ? "Reviewed" : "Mark reviewed"}
        </Button>
      </div>
    </Card>
  );
}

function SkillLists({ job }: { job: JobMatch }) {
  const matched = job.matchedSkills ?? [];
  const unmatched = job.unmatchedSkills ?? [];
  if (matched.length === 0 && unmatched.length === 0) return null;

  return (
    <Card className="mt-4 p-4">
      <div className="grid gap-4 sm:grid-cols-2">
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
    </Card>
  );
}
