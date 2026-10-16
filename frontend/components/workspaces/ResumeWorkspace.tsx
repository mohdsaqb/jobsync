"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
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

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      {result ? (
        <>
          <h2 className="text-[26px] font-semibold tracking-tight text-ink">Your resume is ready</h2>
          <p className="mt-2 text-sm text-muted">
            We found {result.matchCount.toLocaleString()} matching{" "}
            {result.matchCount === 1 ? "role" : "roles"}.
          </p>

          <Card className="mt-6 p-5">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
              <p className="text-sm font-medium text-ink">
                {result.resumeSkills.length > 0
                  ? `${result.resumeSkills.length} skills detected`
                  : "No tracked skills detected"}
              </p>
            </div>

            {result.resumeSkills.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {result.resumeSkills.map((skill) => (
                  <Badge key={skill}>{skill}</Badge>
                ))}
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-2 border-t border-hairline pt-5">
              <Button onClick={onContinue} icon={<ArrowRight className="h-4 w-4" />}>
                View matched jobs
              </Button>
              <Button variant="secondary" onClick={onReset}>
                Replace resume
              </Button>
            </div>
          </Card>
        </>
      ) : (
        <>
          <h2 className="text-[26px] font-semibold tracking-tight text-ink">Start with your resume</h2>
          <p className="mt-2 text-sm text-muted">
            Upload it to find roles that match your skills and experience.
          </p>

          <Card className="mt-6 p-5">
            <Dropzone file={file} onSelect={setFile} disabled={loading} />

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <TextInput
                label="Target role (optional)"
                placeholder="Senior Frontend Developer"
                value={targetRole}
                maxLength={200}
                disabled={loading}
                onChange={(e) => setTargetRole(e.target.value)}
              />
              <TextInput
                label="Location (optional)"
                placeholder="Bengaluru"
                value={location}
                maxLength={120}
                disabled={loading}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            {error && (
              <Alert tone="error" className="mt-4">
                {error}
              </Alert>
            )}

            <div className="mt-5 border-t border-hairline pt-5">
              <Button
                onClick={() => file && onSubmit(file, { targetRole, location })}
                disabled={!file}
                loading={loading}
              >
                {loading ? "Analyzing…" : error ? "Try again" : "Find matching jobs"}
              </Button>
              <p className="mt-3 text-[13px] text-muted">
                Your file is deleted straight after it is read.
              </p>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
