"use client";

import { useCallback, useEffect, useState } from "react";

const savedKey = (jobId: string) => `resume-analyser:saved:${jobId}`;

export function useJobActions(jobId: string | null | undefined) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
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

  return { saved, toggleSaved };
}
