"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AppShell from "@/components/shell/AppShell";
import JobsWorkspace from "@/components/workspaces/JobsWorkspace";
import ResumeWorkspace from "@/components/workspaces/ResumeWorkspace";
import SuggestionsWorkspace from "@/components/workspaces/SuggestionsWorkspace";
import { analyzeResume, getResumeSuggestions } from "@/lib/api";
import type { AnalyzeResult, ResumeSuggestions } from "@/lib/types";
import { WORKSPACE_LABELS, type Workspace } from "@/lib/workspace";

function workspaceFromHash(): Workspace {
  const hash = window.location.hash.slice(1);
  return Object.keys(WORKSPACE_LABELS).includes(hash) ? hash as Workspace : "resume";
}

export default function Home() {
  const [workspace, setWorkspace] = useState<Workspace>("resume");
  const [analysis, setAnalysis] = useState<AnalyzeResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<ResumeSuggestions | null>(null);
  const [generating, setGenerating] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const lastFile = useRef<File | null>(null);

  const go = useCallback((next: Workspace) => {
    setWorkspace(next);
    if (workspaceFromHash() !== next) window.history.pushState(null, "", `#${next}`);
  }, []);

  useEffect(() => {
    const syncWorkspace = () => setWorkspace(workspaceFromHash());
    syncWorkspace();
    window.addEventListener("popstate", syncWorkspace);
    return () => window.removeEventListener("popstate", syncWorkspace);
  }, []);

  async function runAnalysis(file: File) {
    lastFile.current = file;
    setAnalyzing(true);
    setAnalyzeError(null);
    try {
      setAnalysis(await analyzeResume(file));
      setSelectedJobId(null);
      setSuggestions(null);
      setSuggestError(null);
    } catch (error) {
      setAnalyzeError(error instanceof Error ? error.message : "Could not analyze your resume.");
    } finally {
      setAnalyzing(false);
    }
  }

  function reset() {
    setAnalysis(null);
    setAnalyzeError(null);
    setSelectedJobId(null);
    setSuggestions(null);
    setSuggestError(null);
    lastFile.current = null;
    go("resume");
  }

  async function generate(role: string) {
    const targetRole = role.trim();
    if (!targetRole || !analysis) return;
    setGenerating(true);
    setSuggestError(null);
    try {
      const text = await getResumeSuggestions(analysis.resumeText, targetRole);
      setSuggestions({ text, targetRole });
    } catch (error) {
      setSuggestions(null);
      setSuggestError(error instanceof Error ? error.message : "Could not generate suggestions.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <AppShell
      current={workspace}
      onNavigate={go}
      matchCount={analysis?.matches.length ?? null}
      hasResults={analysis !== null}
      busy={analyzing}
    >
      {workspace === "resume" && (
        <ResumeWorkspace
          loading={analyzing}
          error={analyzeError}
          result={analysis}
          onSubmit={runAnalysis}
          onContinue={() => go("jobs")}
          onReset={reset}
        />
      )}
      {workspace === "jobs" && (
        <JobsWorkspace
          matches={analysis?.matches ?? null}
          loading={analyzing}
          error={analyzeError}
          selectedJobId={selectedJobId}
          onSelectJob={setSelectedJobId}
          onGetSuggestions={() => go("suggestions")}
          onGoToResume={() => go("resume")}
          onRetry={() => lastFile.current ? void runAnalysis(lastFile.current) : go("resume")}
        />
      )}
      {workspace === "suggestions" && (
        <SuggestionsWorkspace
          hasResume={analysis !== null}
          suggestions={suggestions}
          loading={generating}
          error={suggestError}
          onGenerate={generate}
          onGoToResume={() => go("resume")}
        />
      )}
    </AppShell>
  );
}
