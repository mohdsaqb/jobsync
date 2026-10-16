import type { AnalyzeMeta, JobMatch } from "./types";

interface AnalyzeResumeResult {
  matches: JobMatch[];
  resumeText: string;
  /** Tracked skills detected in the resume; empty when none were recognised. */
  resumeSkills: string[];
  meta?: AnalyzeMeta;
}

export interface AnalyzeOptions {
  /** Optional hints that let the backend pull in fresh postings for this role. */
  targetRole?: string;
  location?: string;
}

export async function analyzeResume(file: File, options: AnalyzeOptions = {}): Promise<AnalyzeResumeResult> {
  const formData = new FormData();
  formData.append("resume", file);
  if (options.targetRole?.trim()) formData.append("targetRole", options.targetRole.trim());
  if (options.location?.trim()) formData.append("location", options.location.trim());

  const response = await fetch("/api/resume/analyze", {
    method: "POST",
    body: formData,
  });

  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.error ?? "Failed to analyze resume.");
  }

  return {
    matches: body.matches as JobMatch[],
    resumeText: body.resumeText as string,
    resumeSkills: (body.resumeSkills as string[] | undefined) ?? [],
    meta: body.meta as AnalyzeMeta | undefined,
  };
}

export async function getResumeSuggestions(resumeText: string, targetRole: string): Promise<string> {
  const response = await fetch("/api/resume/suggest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resumeText, targetRole }),
  });

  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.error ?? "Failed to generate suggestions.");
  }

  return body.suggestions as string;
}
