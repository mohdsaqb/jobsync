"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, FileSearch, ListChecks, Lock, Search, Sparkles } from "lucide-react";
import PageHeading from "@/components/shell/PageHeading";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TextInput } from "@/components/ui/Field";
import Dropzone from "./Dropzone";
import type { AnalyzeOptions } from "@/lib/api";

export interface ResumeResult {
  matchCount: number;
  resumeSkills: string[];
  resumeChars: number;
  warming: boolean;
}

export default function ResumeWorkspace({
  loading,
  error,
  result,
  onSubmit,
  onContinue,
  onReset,
}: {
  loading: boolean;
  error: string | null;
  /** Present once an analysis has succeeded. */
  result: ResumeResult | null;
  onSubmit: (file: File, hints: AnalyzeOptions) => void;
  onContinue: () => void;
  onReset: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [targetRole, setTargetRole] = useState("");
  const [location, setLocation] = useState("");

  if (result) {
    return (
      <div className="mx-auto max-w-workspace px-4 py-8 sm:px-6 lg:px-8">
        <PageHeading
          eyebrow="Step 01 / Build your profile"
          title="Your resume is ready."
          description="We read your resume, matched it against the indexed roles, and pulled out the skills we recognised."
        />
        <ReadyState result={result} onContinue={onContinue} onReset={onReset} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-workspace px-4 py-8 sm:px-6 lg:px-8">
      <PageHeading
        eyebrow="Step 01 / Build your profile"
        title="Start with your resume."
        description="Upload your resume to discover relevant opportunities and receive personalized recommendations based on your skills and experience."
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="p-5 sm:p-6">
          <Dropzone file={file} onSelect={setFile} disabled={loading} />

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <TextInput
              label="Target role (optional)"
              placeholder="e.g. Senior Frontend Developer"
              value={targetRole}
              maxLength={200}
              disabled={loading}
              onChange={(e) => setTargetRole(e.target.value)}
            />
            <TextInput
              label="Location (optional)"
              placeholder="e.g. Bengaluru"
              value={location}
              maxLength={120}
              disabled={loading}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            Naming a role lets us fetch fresh postings for it in the background. They are indexed for your next
            search rather than this one, because the job API takes several seconds to respond.
          </p>

          {error && (
            <Alert tone="error" title="We couldn't analyze that resume" className="mt-5">
              {error}
            </Alert>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-hairline pt-5">
            <Button
              onClick={() => file && onSubmit(file, { targetRole, location })}
              disabled={!file}
              loading={loading}
              icon={!loading ? <Search className="h-4 w-4" /> : undefined}
            >
              {loading ? "Analyzing resume…" : error ? "Try again" : "Analyze resume & find jobs"}
            </Button>
            <p className="flex items-center gap-1.5 text-xs text-muted">
              <Lock className="h-3 w-3 shrink-0" />
              Your file is parsed on the server and deleted immediately after. It is never stored.
            </p>
          </div>

          {loading && <ProcessingNote />}
        </Card>

        <HowItWorks />
      </div>
    </div>
  );
}

/**
 * The backend exposes no progress channel, so this lists the work being done
 * without claiming to know which part is currently running.
 */
function ProcessingNote() {
  return (
    <div className="mt-5 rounded-lg border border-hairline bg-slate-50/70 px-4 py-3">
      <p className="text-[13px] font-medium text-ink">This usually takes a few seconds.</p>
      <p className="mt-1 text-[13px] leading-relaxed text-muted">
        We extract the text, turn it into a vector, and compare it against every indexed role.
      </p>
    </div>
  );
}

const STEPS = [
  {
    icon: FileSearch,
    title: "Extract your profile",
    body: "We read the text from your PDF, or run OCR if you upload an image.",
  },
  {
    icon: Search,
    title: "Discover relevant opportunities",
    body: "Your resume is compared against indexed roles by meaning, not keywords.",
  },
  {
    icon: Sparkles,
    title: "Improve your applications",
    body: "Get targeted suggestions for a role you want to apply to.",
  },
];

function HowItWorks() {
  return (
    <Card className="h-fit p-5">
      <h2 className="text-[13px] font-semibold uppercase tracking-wide text-slate-400">How it works</h2>
      <ol className="mt-4 space-y-4">
        {STEPS.map((step, i) => (
          <li key={step.title} className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-hairline bg-slate-50 text-slate-500">
              <step.icon className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-medium text-ink">
                <span className="mr-1.5 tabular-nums text-slate-400">{i + 1}.</span>
                {step.title}
              </p>
              <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}

function ReadyState({
  result,
  onContinue,
  onReset,
}: {
  result: ResumeResult;
  onContinue: () => void;
  onReset: () => void;
}) {
  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Card className="p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-50 text-success">
            <CheckCircle2 className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold text-ink">
              {result.matchCount.toLocaleString()} matching {result.matchCount === 1 ? "role" : "roles"} found
            </p>
            <p className="mt-0.5 text-[13px] text-muted">
              Read {result.resumeChars.toLocaleString()} characters from your resume.
            </p>
          </div>
        </div>

        <div className="mt-5 border-t border-hairline pt-5">
          <div className="flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-slate-400" />
            <h3 className="text-[13px] font-semibold text-ink">
              Skills we recognised
              <span className="ml-1.5 font-normal tabular-nums text-muted">({result.resumeSkills.length})</span>
            </h3>
          </div>
          {result.resumeSkills.length > 0 ? (
            <>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {result.resumeSkills.map((skill) => (
                  <Badge key={skill} tone="neutral">
                    {skill}
                  </Badge>
                ))}
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted">
                These are matched against a curated keyword list, so this is a partial view rather than a full
                profile — your whole resume is still used for the semantic match.
              </p>
            </>
          ) : (
            <p className="mt-2 text-[13px] text-muted">
              We didn&apos;t recognise any of our tracked skills in this resume. Matching still works, since it is
              based on overall meaning rather than keywords.
            </p>
          )}
        </div>

        <div className="mt-5 flex flex-wrap gap-3 border-t border-hairline pt-5">
          <Button onClick={onContinue} icon={<ArrowRight className="h-4 w-4" />}>
            View matched jobs
          </Button>
          <Button variant="secondary" onClick={onReset}>
            Replace resume
          </Button>
        </div>
      </Card>

      {result.warming && (
        <Alert tone="info" title="Fetching fresh postings" className="h-fit">
          We&apos;re pulling in new roles for the target role you entered. They&apos;ll be included the next time you
          analyze a resume.
        </Alert>
      )}
    </div>
  );
}
