"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bookmark, BookmarkCheck, Building2, X } from "lucide-react";
import type { JobMatch } from "@/lib/types";
import { scoreTier } from "@/lib/scoreTier";
import { cn } from "@/lib/cn";

interface JobDetailModalProps {
  job: JobMatch | null;
  onClose: () => void;
}

export default function JobDetailModal({ job, onClose }: JobDetailModalProps) {
  const [saved, setSaved] = useState(false);
  const [showApplyNote, setShowApplyNote] = useState(false);

  useEffect(() => {
    if (!job) return;
    setSaved(localStorage.getItem(`resume-analyser:saved:${job.jobId}`) === "1");
    setShowApplyNote(false);
  }, [job]);

  useEffect(() => {
    if (!job) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [job, onClose]);

  const toggleSaved = () => {
    if (!job) return;
    const key = `resume-analyser:saved:${job.jobId}`;
    setSaved((prev) => {
      const next = !prev;
      if (next) localStorage.setItem(key, "1");
      else localStorage.removeItem(key);
      return next;
    });
  };

  const handleApply = () => {
    setShowApplyNote(true);
    setTimeout(() => setShowApplyNote(false), 2500);
  };

  const tier = job ? scoreTier(job.score) : null;
  const percent = job ? Math.round(job.score * 100) : 0;

  return (
    <AnimatePresence>
      {job && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={job.title}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="relative z-10 max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-zinc-900/90 p-6 shadow-2xl shadow-black/60 backdrop-blur-2xl sm:p-8"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-4 top-4 rounded-full p-1.5 text-zinc-400 transition hover:bg-white/10 hover:text-zinc-100"
            >
              <X className="h-4 w-4" />
            </button>

            <h2 className="pr-8 text-lg font-semibold text-zinc-50">{job.title}</h2>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-zinc-400">
              <Building2 className="h-3.5 w-3.5" />
              {job.company}
            </p>

            {tier && (
              <span
                className={cn(
                  "mt-3 inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1",
                  tier.classes,
                )}
              >
                {percent}% &middot; {tier.label}
              </span>
            )}

            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-zinc-300">{job.description}</p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleApply}
                className="rounded-lg bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-900 transition hover:bg-white"
              >
                Apply
              </button>
              <button
                type="button"
                onClick={toggleSaved}
                className="flex items-center gap-2 rounded-lg border border-white/10 px-3.5 py-2 text-sm font-medium text-zinc-300 transition hover:border-white/20 hover:text-zinc-50"
              >
                {saved ? <BookmarkCheck className="h-4 w-4 text-amber-300" /> : <Bookmark className="h-4 w-4" />}
                {saved ? "Saved" : "Save"}
              </button>
              {showApplyNote && (
                <span className="text-xs text-zinc-500">Demo data — apply links aren&apos;t wired up yet.</span>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
