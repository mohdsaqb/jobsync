"use client";

import { useState } from "react";
import { Sparkles, Wand2 } from "lucide-react";
import { getResumeSuggestions } from "@/lib/api";

interface ResumeSuggestionsProps {
  resumeText: string;
}

export default function ResumeSuggestions({ resumeText }: ResumeSuggestionsProps) {
  const [targetRole, setTargetRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string | null>(null);
  const [suggestionsFor, setSuggestionsFor] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const role = targetRole.trim();
    if (!role) return;

    setLoading(true);
    setError(null);
    try {
      const result = await getResumeSuggestions(resumeText, role);
      setSuggestions(result);
      setSuggestionsFor(role);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setSuggestions(null);
    setTargetRole("");
    setError(null);
  };

  return (
    <div className="mt-10 rounded-2xl border border-white/10 bg-zinc-900/40 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-8">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-950/50">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-zinc-50">Improve your resume</h2>
          <p className="text-sm text-zinc-400">Tell us the role you&apos;re targeting and get AI-tailored suggestions.</p>
        </div>
      </div>

      {!suggestions && (
        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder="e.g. Senior Frontend Developer"
            className="flex-1 rounded-xl border border-white/10 bg-zinc-950/50 px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-400/60 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!targetRole.trim() || loading}
            className="flex items-center justify-center gap-2 rounded-xl bg-zinc-50 px-4 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-white disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
          >
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-400 border-t-zinc-900" />
            ) : (
              <Wand2 className="h-4 w-4" />
            )}
            {loading ? "Analyzing..." : "Get suggestions"}
          </button>
        </form>
      )}

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      {suggestions && (
        <div className="mt-5">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
            Suggestions for {suggestionsFor}
          </p>
          <div className="whitespace-pre-line rounded-xl border border-white/10 bg-zinc-950/40 p-4 text-sm leading-relaxed text-zinc-300">
            {suggestions}
          </div>
          <button
            type="button"
            onClick={reset}
            className="mt-3 text-sm font-medium text-indigo-300 transition hover:text-indigo-200"
          >
            Try a different role
          </button>
        </div>
      )}
    </div>
  );
}
