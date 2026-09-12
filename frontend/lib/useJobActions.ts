"use client";

import { useCallback, useEffect, useState } from "react";

const APPLY_NOTE_MS = 2500;
const savedKey = (jobId: string) => `resume-analyser:saved:${jobId}`;

// Bookmark + "Apply" demo-note behaviour, shared by JobCard and JobDetailModal.
export function useJobActions(jobId: string | null | undefined) {
  const [saved, setSaved] = useState(false);
  const [showApplyNote, setShowApplyNote] = useState(false);

  useEffect(() => {
    setShowApplyNote(false);
    if (!jobId) return;
    setSaved(localStorage.getItem(savedKey(jobId)) === "1");
  }, [jobId]);

  const toggleSaved = useCallback(() => {
    if (!jobId) return;
    setSaved((prev) => {
      const next = !prev;
      if (next) localStorage.setItem(savedKey(jobId), "1");
      else localStorage.removeItem(savedKey(jobId));
      return next;
    });
  }, [jobId]);

  const handleApply = useCallback(() => {
    setShowApplyNote(true);
    setTimeout(() => setShowApplyNote(false), APPLY_NOTE_MS);
  }, []);

  return { saved, toggleSaved, showApplyNote, handleApply };
}
