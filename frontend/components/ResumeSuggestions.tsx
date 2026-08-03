"use client";

import { Fragment, useState } from "react";
import { Sparkles, Wand2 } from "lucide-react";
import { getResumeSuggestions } from "@/lib/api";

interface ResumeSuggestionsProps {
  resumeText: string;
}

/** Splits on **bold** markers and wraps the bold segments in <strong>. */
function renderInline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="font-semibold text-zinc-100">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

/**
 * Gemini's response is markdown-ish (numbered points with a bold lead-in
 * followed by a body paragraph, occasional bullet lists). There's no
 * markdown library in this project, and the shape is predictable enough
 * that a small hand-rolled formatter reads better than raw text with
 * literal "**" in it.
 */
function SuggestionsContent({ text }: { text: string }) {
  const blocks = text.trim().split(/\n{2,}/);

  return (
    <div className="space-y-4">
      {blocks.map((block, i) => {
        const lines = block
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean);
        const numberedMatch = lines[0]?.match(/^(\d+)\.\s+(.*)/);

        if (numberedMatch) {
          const [, number, heading] = numberedMatch;
          const body = lines.slice(1).join(" ");
          return (
            <div key={i} className="flex gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500/15 text-xs font-semibold text-indigo-300">
                {number}
              </span>
              <div>
                <p className="font-semibold text-zinc-100">{renderInline(heading)}</p>
                {body && <p className="mt-1 leading-relaxed text-zinc-300">{renderInline(body)}</p>}
              </div>
            </div>
          );
        }

        if (lines.every((line) => /^[-*]\s/.test(line))) {
          return (
            <ul key={i} className="list-disc space-y-1.5 pl-5 text-zinc-300">
              {lines.map((line, j) => (
                <li key={j} className="leading-relaxed">
                  {renderInline(line.replace(/^[-*]\s/, ""))}
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={i} className="leading-relaxed text-zinc-300">
            {renderInline(lines.join(" "))}
          </p>
        );
      })}
    </div>
  );
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
          <div className="rounded-xl border border-white/10 bg-zinc-950/40 p-4 text-sm sm:p-5">
            <SuggestionsContent text={suggestions} />
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
