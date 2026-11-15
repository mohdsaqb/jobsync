import type { AnalyzeResult } from "./types";

export async function analyzeResume(file: File): Promise<AnalyzeResult> {
  const formData = new FormData();
  formData.append("resume", file);

  const response = await fetch("/api/resume/analyze", {
    method: "POST",
    body: formData,
  });

  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.error ?? "Failed to analyze resume.");
  }

  return {
    matches: body.matches,
    resumeText: body.resumeText,
    resumeSkills: Array.isArray(body.resumeSkills) ? body.resumeSkills as string[] : null,
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
