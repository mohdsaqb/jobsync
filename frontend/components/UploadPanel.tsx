"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, Image as ImageIcon, UploadCloud, X } from "lucide-react";
import { cn } from "@/lib/cn";

interface UploadPanelProps {
  onSubmit: (file: File) => void;
  loading: boolean;
  error: string | null;
}

const ACCEPTED_TYPES = [".pdf", ".png", ".jpg", ".jpeg"];
const MAX_SIZE = 5 * 1024 * 1024;

const LOADING_STEPS = [
  "Reading your resume...",
  "Understanding your experience...",
  "Matching you with open roles...",
];

export default function UploadPanel({ onSubmit, loading, error }: UploadPanelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [sizeError, setSizeError] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading) {
      setStepIndex(0);
      return;
    }
    const id = setInterval(() => {
      setStepIndex((i) => (i + 1) % LOADING_STEPS.length);
    }, 1100);
    return () => clearInterval(id);
  }, [loading]);

  const selectFile = (candidate: File | undefined | null) => {
    if (!candidate) return;
    if (candidate.size > MAX_SIZE) {
      setSizeError("File is too large — please upload something under 5MB.");
      setFile(null);
      return;
    }
    setSizeError(null);
    setFile(candidate);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    selectFile(e.dataTransfer.files?.[0]);
  };

  const FileIcon = file?.type === "application/pdf" ? FileText : ImageIcon;

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-6 pt-8 sm:pt-16">
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-50">Find your next role</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Upload your resume and we&apos;ll semantically match it against open roles in seconds.
        </p>
      </div>

      <div className="w-full rounded-2xl border border-white/10 bg-zinc-900/40 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-8">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition",
            dragActive
              ? "border-indigo-400/70 bg-indigo-500/5"
              : "border-white/15 hover:border-white/30 hover:bg-white/[0.02]",
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            className="hidden"
            onChange={(e) => selectFile(e.target.files?.[0])}
          />

          {file ? (
            <div className="flex items-center gap-3">
              <FileIcon className="h-8 w-8 text-indigo-300" />
              <div className="text-left">
                <p className="text-sm font-medium text-zinc-100">{file.name}</p>
                <p className="text-xs text-zinc-500">{(file.size / 1024).toFixed(0)} KB</p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                }}
                className="ml-2 rounded-full p-1 text-zinc-500 hover:bg-white/10 hover:text-zinc-200"
                aria-label="Remove file"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              <UploadCloud className="h-9 w-9 text-zinc-500" />
              <div>
                <p className="text-sm font-medium text-zinc-200">Drag & drop your resume here</p>
                <p className="mt-1 text-xs text-zinc-500">or click to browse — PDF, PNG, or JPG, up to 5MB</p>
              </div>
            </>
          )}
        </div>

        {(error || sizeError) && <p className="mt-4 text-sm text-red-400">{error ?? sizeError}</p>}

        <button
          type="button"
          onClick={() => file && onSubmit(file)}
          disabled={!file || loading}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-white disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-400 border-t-zinc-900" />
              {LOADING_STEPS[stepIndex]}
            </>
          ) : (
            "Find matching jobs"
          )}
        </button>
      </div>
    </div>
  );
}
