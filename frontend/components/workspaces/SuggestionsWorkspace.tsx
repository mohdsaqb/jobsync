"use client";

import { useState } from "react";
import { Check, Copy, Sparkles } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { TextInput } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";
import { emphasisParts, itemToPlainText, parseSuggestions, type SuggestionItem } from "@/lib/suggestionFormat";
import type { ResumeSuggestions } from "@/lib/types";

export default function SuggestionsWorkspace({
  hasResume,
  suggestions,
  loading,
  error,
  onGenerate,
  onGoToResume,
}: {
  hasResume: boolean;
  suggestions: ResumeSuggestions | null;
  loading: boolean;
  error: string | null;
  onGenerate: (role: string) => void;
  onGoToResume: () => void;
}) {
  const [role, setRole] = useState(suggestions?.targetRole ?? "");
  const stale = suggestions !== null && suggestions.targetRole !== role.trim();
  const items = suggestions && !stale ? parseSuggestions(suggestions.text) : [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      {!hasResume ? (
        <Card>
          <EmptyState
            title="No resume yet"
            description="Upload a resume to get suggestions for a role."
            action={<Button onClick={onGoToResume}>Upload resume</Button>}
          />
        </Card>
      ) : (
        <>
          <Card className="p-4">
            <form
              className="flex flex-wrap items-end gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                if (role.trim() && !loading) onGenerate(role);
              }}
            >
              <TextInput
                className="min-w-[200px] flex-1"
                label="Target role"
                placeholder="Enter your target role"
                value={role}
                maxLength={200}
                disabled={loading}
                onChange={(event) => setRole(event.target.value)}
              />
              <Button type="submit" disabled={!role.trim()} loading={loading} icon={<Sparkles className="h-4 w-4" />}>
                {items.length ? "Regenerate" : "Get suggestions"}
              </Button>
            </form>
          </Card>

          {error && <Alert tone="error" className="mt-4">{error}</Alert>}

          {loading ? (
            <div className="mt-4 space-y-2.5" role="status" aria-label="Generating suggestions">
              {[1, 2, 3].map((number) => (
                <Card key={number} className="p-4">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="mt-2.5 h-3.5 w-full" />
                  <Skeleton className="mt-1.5 h-3.5 w-4/5" />
                </Card>
              ))}
            </div>
          ) : items.length > 0 ? (
            <ol className="mt-4 space-y-2.5">
              {items.map((item, index) => (
                <li key={`${suggestions?.targetRole}:${suggestions?.text}:${item.id}`}>
                  <SuggestionCard item={item} index={index + 1} />
                </li>
              ))}
            </ol>
          ) : !error && (
            <Card className="mt-4">
              <EmptyState
                title={stale ? "Role changed" : "No suggestions yet"}
                description={stale ? "Generate again for the new role." : "Enter a target role to get resume improvement suggestions."}
              />
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function SuggestionCard({ item, index }: { item: SuggestionItem; index: number }) {
  const [copied, setCopied] = useState(false);
  const [reviewed, setReviewed] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(itemToPlainText(item));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Card className={cn("p-4", reviewed && "bg-slate-50")}>
      <div className={cn("flex gap-3", reviewed && "opacity-55")}>
        <span className="mt-0.5 text-[13px] font-semibold tabular-nums text-muted">{index}</span>
        <div className="min-w-0 flex-1">
          {item.heading && <p className="text-sm font-semibold text-ink">{item.heading}</p>}
          {item.body && (
            <p className={cn("text-sm leading-relaxed text-slate-700", item.heading && "mt-1")}>
              {emphasisParts(item.body).map((part, index) => part.bold
                ? <strong key={index} className="font-semibold text-ink">{part.text}</strong>
                : <span key={index}>{part.text}</span>)}
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
          onClick={() => setReviewed(!reviewed)}
          aria-pressed={reviewed}
          icon={<Check className={cn("h-3.5 w-3.5", reviewed && "text-success")} />}
        >
          {reviewed ? "Reviewed" : "Mark reviewed"}
        </Button>
      </div>
    </Card>
  );
}
