"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AppShell from "@/components/shell/AppShell";
import JobsWorkspace from "@/components/workspaces/JobsWorkspace";
import ResumeWorkspace, { type ResumeResult } from "@/components/workspaces/ResumeWorkspace";
import SuggestionsWorkspace from "@/components/workspaces/SuggestionsWorkspace";
import { analyzeResume, getResumeSuggestions, type AnalyzeOptions } from "@/lib/api";
import type { JobMatch } from "@/lib/types";
import type { Workspace } from "@/lib/workspace";

const WORKSPACES: Workspace[] = ["resume", "jobs", "suggestions"];

function workspaceFromHash(): Workspace | null {
  if (typeof window === "undefined") return null;
  const candidate = window.location.hash.replace("#", "") as Workspace;
  return WORKSPACES.includes(candidate) ? candidate : null;
}

export default function Home() {
  const [workspace, setWorkspace] = useState<Workspace>("resume");

  const [matches, setMatches] = useState<JobMatch[] | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [resumeResult, setResumeResult] = useState<ResumeResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const [suggestions, setSuggestions] = useState<{ text: string; forLabel: string } | null>(null);
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [suggestError, setSuggestError] = useState<string | null>(null);

  const lastSubmission = useRef<{ file: File; hints: AnalyzeOptions } | null>(null);

  /**
   * The workspace lives in the URL hash so browser back/forward move between
   * steps instead of leaving the app. A refresh keeps the hash but loses the
   * in-memory results, which each workspace already handles with a
   * "upload a resume first" state.
   */
  const go = useCallback((next: Workspace) => {
    setWorkspace(next);
    if (typeof window !== "undefined" && workspaceFromHash() !== next) {
      window.history.pushState({ workspace: next }, "", `#${next}`);
    }
  }, []);

  useEffect(() => {
    const fromHash = workspaceFromHash();
    if (fromHash) setWorkspace(fromHash);

    const onPopState = () => setWorkspace(workspaceFromHash() ?? "resume");
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const runAnalysis = useCallback(
    async (file: File, hints: AnalyzeOptions) => {
      lastSubmission.current = { file, hints };
      setAnalyzing(true);
      setAnalyzeError(null);
      try {
        const result = await analyzeResume(file, hints);
        setMatches(result.matches);
        setResumeText(result.resumeText);
        setResumeResult({
          matchCount: result.matches.length,
          resumeSkills: result.resumeSkills,
          resumeChars: result.resumeText.length,
        });
        // A new resume invalidates the previous selection and advice.
        setSelectedJobId(null);
        setSuggestions(null);
        setSuggestError(null);
      } catch (err) {
        setAnalyzeError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setAnalyzing(false);
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setMatches(null);
    setResumeText("");
    setResumeResult(null);
    setAnalyzeError(null);
    setSelectedJobId(null);
    setSuggestions(null);
    setSuggestError(null);
    lastSubmission.current = null;
    go("resume");
  }, [go]);

  const generate = useCallback(
    async (role: string) => {
      const target = role.trim();
      if (!target || !resumeText) return;

      setGeneratingFor(target);
      setSuggestError(null);
      try {
        const text = await getResumeSuggestions(resumeText, target);
        setSuggestions({ text, forLabel: target });
      } catch (err) {
        setSuggestions(null);
        setSuggestError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setGeneratingFor(null);
      }
    },
    [resumeText],
  );

  const selectedJob = matches?.find((job) => job.jobId === selectedJobId) ?? null;
  const hasResults = matches !== null;

  return (
    <AppShell
      current={workspace}
      onNavigate={go}
      matchCount={matches?.length ?? null}
      hasResults={hasResults}
      busy={analyzing}
    >
      {workspace === "resume" && (
        <ResumeWorkspace
          loading={analyzing}
          error={analyzeError}
          result={resumeResult}
          onSubmit={runAnalysis}
          onContinue={() => go("jobs")}
          onReset={reset}
        />
      )}

      {workspace === "jobs" && (
        <JobsWorkspace
          matches={matches}
          loading={analyzing}
          error={analyzeError}
          selectedJobId={selectedJobId}
          onSelectJob={setSelectedJobId}
          onGetSuggestions={() => go("suggestions")}
          onGoToResume={() => go("resume")}
          onRetry={() => {
            const last = lastSubmission.current;
            if (last) void runAnalysis(last.file, last.hints);
            else go("resume");
          }}
        />
      )}

      {workspace === "suggestions" && (
        <SuggestionsWorkspace
          job={selectedJob}
          hasResults={hasResults}
          suggestions={suggestions}
          generatingFor={generatingFor}
          error={suggestError}
          onGenerate={generate}
          onGoToJobs={() => go("jobs")}
          onGoToResume={() => go("resume")}
        />
      )}
    </AppShell>
  );
}
