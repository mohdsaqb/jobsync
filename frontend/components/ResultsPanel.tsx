"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import JobCard from "./JobCard";
import JobDetailModal from "./JobDetailModal";
import ResumeSuggestions from "./ResumeSuggestions";
import type { JobMatch } from "@/lib/types";

interface ResultsPanelProps {
  matches: JobMatch[];
  resumeText: string;
  visibleCount: number;
  onLoadMore: () => void;
  onNewAnalysis: () => void;
}

export default function ResultsPanel({
  matches,
  resumeText,
  visibleCount,
  onLoadMore,
  onNewAnalysis,
}: ResultsPanelProps) {
  const [selectedJob, setSelectedJob] = useState<JobMatch | null>(null);
  const visible = matches.slice(0, visibleCount);
  const hasMore = visibleCount < matches.length;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
            {matches.length} matching role{matches.length === 1 ? "" : "s"}
          </h1>
          <p className="mt-1 text-sm text-zinc-400">Ranked by semantic similarity to your resume.</p>
        </div>
        <button
          type="button"
          onClick={onNewAnalysis}
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-zinc-900/40 px-3.5 py-2 text-sm font-medium text-zinc-300 backdrop-blur-xl transition hover:border-white/20 hover:text-zinc-50"
        >
          <RotateCcw className="h-4 w-4" />
          Upload another resume
        </button>
      </div>

      <motion.div layout className="grid gap-4 sm:grid-cols-2">
        {visible.map((match, i) => (
          <motion.div
            key={match.jobId}
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i, 9) * 0.03, duration: 0.25 }}
          >
            <JobCard match={match} onOpen={setSelectedJob} />
          </motion.div>
        ))}
      </motion.div>

      <div className="mt-8 flex justify-center">
        {hasMore ? (
          <button
            type="button"
            onClick={onLoadMore}
            className="rounded-xl border border-white/10 bg-zinc-900/40 px-6 py-2.5 text-sm font-medium text-zinc-200 backdrop-blur-xl transition hover:border-white/20 hover:bg-zinc-900/60"
          >
            Show 10 more
          </button>
        ) : (
          <p className="text-sm text-zinc-500">You&apos;ve seen all {matches.length} matches.</p>
        )}
      </div>

      <ResumeSuggestions resumeText={resumeText} />

      <JobDetailModal job={selectedJob} onClose={() => setSelectedJob(null)} />
    </div>
  );
}
