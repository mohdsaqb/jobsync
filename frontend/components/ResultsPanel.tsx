"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import JobCard from "./JobCard";
import JobDetailModal from "./JobDetailModal";
import type { JobMatch } from "@/lib/types";

interface ResultsPanelProps {
  matches: JobMatch[];
  onNewAnalysis: () => void;
}

const PAGE_SIZE = 20;

export default function ResultsPanel({ matches, onNewAnalysis }: ResultsPanelProps) {
  const [selectedJob, setSelectedJob] = useState<JobMatch | null>(null);
  const [page, setPage] = useState(1);
  const [direction, setDirection] = useState(0);
  const [jumpValue, setJumpValue] = useState("");

  const totalPages = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));

  // A fresh set of matches (new resume analyzed) always starts back on page 1.
  useEffect(() => {
    setPage(1);
    setDirection(0);
    setJumpValue("");
  }, [matches]);

  const visible = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return matches.slice(start, start + PAGE_SIZE);
  }, [matches, page]);

  const goToPage = (target: number) => {
    const clamped = Math.min(Math.max(target, 1), totalPages);
    if (clamped === page) return;
    setDirection(clamped > page ? 1 : -1);
    setPage(clamped);
    setJumpValue("");
  };

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = Number(jumpValue);
    if (Number.isFinite(target) && target >= 1) goToPage(target);
  };

  const rangeStart = matches.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, matches.length);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
            {matches.length} matching role{matches.length === 1 ? "" : "s"}
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Ranked by semantic similarity to your resume.
            {matches.length > 0 && (
              <>
                {" "}
                Showing {rangeStart}&ndash;{rangeEnd}.
              </>
            )}
          </p>
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

      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={page}
            custom={direction}
            initial={{ opacity: 0, x: direction >= 0 ? 24 : -24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction >= 0 ? -24 : 24 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="grid gap-4 sm:grid-cols-2"
          >
            {visible.map((match, i) => (
              <motion.div
                key={match.jobId}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 19) * 0.02, duration: 0.2 }}
              >
                <JobCard match={match} onOpen={setSelectedJob} />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {totalPages > 1 && (
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => goToPage(page - 1)}
            disabled={page === 1}
            aria-label="Previous page"
            className="flex items-center gap-1 rounded-xl border border-white/10 bg-zinc-900/40 px-3.5 py-2 text-sm font-medium text-zinc-200 backdrop-blur-xl transition hover:border-white/20 hover:bg-zinc-900/60 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-white/10 disabled:hover:bg-zinc-900/40"
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </button>

          <span className="text-sm text-zinc-400">
            Page {page} of {totalPages}
          </span>

          <button
            type="button"
            onClick={() => goToPage(page + 1)}
            disabled={page === totalPages}
            aria-label="Next page"
            className="flex items-center gap-1 rounded-xl border border-white/10 bg-zinc-900/40 px-3.5 py-2 text-sm font-medium text-zinc-200 backdrop-blur-xl transition hover:border-white/20 hover:bg-zinc-900/60 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-white/10 disabled:hover:bg-zinc-900/40"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>

          <form onSubmit={handleJumpSubmit} className="flex items-center gap-2">
            <label htmlFor="jump-to-page" className="text-sm text-zinc-500">
              Jump to
            </label>
            <input
              id="jump-to-page"
              type="number"
              min={1}
              max={totalPages}
              value={jumpValue}
              onChange={(e) => setJumpValue(e.target.value)}
              placeholder={String(page)}
              className="w-16 rounded-lg border border-white/10 bg-zinc-900/40 px-2 py-1.5 text-center text-sm text-zinc-200 backdrop-blur-xl outline-none transition focus:border-white/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              type="submit"
              className="rounded-lg border border-white/10 bg-zinc-900/40 px-3 py-1.5 text-sm font-medium text-zinc-300 backdrop-blur-xl transition hover:border-white/20 hover:text-zinc-50"
            >
              Go
            </button>
          </form>
        </div>
      )}

      <JobDetailModal job={selectedJob} onClose={() => setSelectedJob(null)} />
    </div>
  );
}
