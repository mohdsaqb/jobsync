"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Sidebar from "@/components/Sidebar";
import UploadPanel from "@/components/UploadPanel";
import ResultsPanel from "@/components/ResultsPanel";
import BackgroundGlow from "@/components/BackgroundGlow";
import { analyzeResume } from "@/lib/api";
import type { JobMatch } from "@/lib/types";

type Screen = "upload" | "results";

export default function Home() {
  const [screen, setScreen] = useState<Screen>("upload");
  const [matches, setMatches] = useState<JobMatch[] | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(10);

  const handleUpload = async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const results = await analyzeResume(file);
      setMatches(results.matches);
      setResumeText(results.resumeText);
      setVisibleCount(10);
      setScreen("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleNewAnalysis = () => {
    setMatches(null);
    setResumeText("");
    setError(null);
    setVisibleCount(10);
    setScreen("upload");
  };

  return (
    <div className="relative flex h-screen overflow-hidden bg-zinc-950 text-zinc-100">
      <BackgroundGlow />
      <Sidebar screen={screen} hasResults={matches !== null} onSelect={setScreen} />
      <main className="relative z-0 flex-1 overflow-y-auto px-6 py-10 sm:px-10">
        <AnimatePresence mode="wait">
          {screen === "upload" || !matches ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              <UploadPanel onSubmit={handleUpload} loading={loading} error={error} />
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              <ResultsPanel
                matches={matches}
                resumeText={resumeText}
                visibleCount={visibleCount}
                onLoadMore={() => setVisibleCount((c) => Math.min(c + 10, matches.length))}
                onNewAnalysis={handleNewAnalysis}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
