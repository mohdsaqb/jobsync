"use client";

import { useEffect, useState } from "react";
import { Bookmark, BookmarkCheck, Building2 } from "lucide-react";
import type { JobMatch } from "@/lib/types";
import { scoreTier } from "@/lib/scoreTier";
import { cn } from "@/lib/cn";

interface JobCardProps {
  match: JobMatch;
  onOpen: (match: JobMatch) => void;
}

export default function JobCard({ match, onOpen }: JobCardProps) {
  const [saved, setSaved] = useState(false);
  const [showApplyNote, setShowApplyNote] = useState(false);
  const storageKey = `resume-analyser:saved:${match.jobId}`;
  const percent = Math.round(match.score * 100);
  const tier = scoreTier(match.score);

  useEffect(() => {
    setSaved(localStorage.getItem(storageKey) === "1");
  }, [storageKey]);

  const toggleSaved = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSaved((prev) => {
      const next = !prev;
      if (next) localStorage.setItem(storageKey, "1");
      else localStorage.removeItem(storageKey);
      return next;
    });
  };

  const handleApply = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowApplyNote(true);
    setTimeout(() => setShowApplyNote(false), 2500);
  };

  return (
    <div
      onClick={() => onOpen(match)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onOpen(match);
      }}
      className="group flex h-full cursor-pointer flex-col rounded-2xl border border-white/10 bg-zinc-900/40 p-5 shadow-lg shadow-black/30 backdrop-blur-xl transition hover:border-white/20 hover:bg-zinc-900/60"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-zinc-50">{match.title}</h3>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-zinc-400">
            <Building2 className="h-3.5 w-3.5" />
            {match.company}
          </p>
        </div>
        <button
          type="button"
          onClick={toggleSaved}
          aria-label={saved ? "Remove from saved jobs" : "Save job"}
          className="shrink-0 rounded-full p-1.5 text-zinc-400 transition hover:bg-white/10 hover:text-amber-300"
        >
          {saved ? <BookmarkCheck className="h-4 w-4 text-amber-300" /> : <Bookmark className="h-4 w-4" />}
        </button>
      </div>

      <span
        className={cn(
          "mt-3 inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1",
          tier.classes,
        )}
      >
        {percent}% &middot; {tier.label}
      </span>

      <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-zinc-400">{match.description}</p>

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={handleApply}
          className="rounded-lg bg-zinc-50 px-3.5 py-2 text-sm font-medium text-zinc-900 transition hover:bg-white"
        >
          Apply
        </button>
        {showApplyNote && (
          <span className="text-xs text-zinc-500">Demo data — apply links aren&apos;t wired up yet.</span>
        )}
        <span className="ml-auto text-xs text-zinc-600 opacity-0 transition group-hover:opacity-100">
          Click for details
        </span>
      </div>
    </div>
  );
}
