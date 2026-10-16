"use client";

import { useRef, useState } from "react";
import { FileText, Image as ImageIcon, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

/** Mirrors the backend's multer allowlist and 5MB cap in resume.routes.ts. */
export const ACCEPTED_EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg"];
export const MAX_SIZE_BYTES = 5 * 1024 * 1024;

export default function Dropzone({
  file,
  onSelect,
  disabled,
}: {
  file: File | null;
  onSelect: (file: File | null) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [sizeError, setSizeError] = useState<string | null>(null);

  const accept = (candidate?: File) => {
    if (!candidate) return;
    if (candidate.size > MAX_SIZE_BYTES) {
      setSizeError("That file is over the 5MB limit. Try a smaller export of your resume.");
      onSelect(null);
      return;
    }
    setSizeError(null);
    onSelect(candidate);
  };

  if (file) {
    const isImage = file.type.startsWith("image/");
    return (
      <div className="rounded-xl border border-hairline bg-slate-50/60 p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-hairline bg-surface text-brand">
            {isImage ? <ImageIcon className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink">{file.name}</p>
            <p className="mt-0.5 text-[13px] text-muted">
              {isImage ? "Image" : "PDF"} · {(file.size / 1024).toFixed(0)} KB
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onSelect(null);
              setSizeError(null);
            }}
            disabled={disabled}
            icon={<X className="h-4 w-4" />}
          >
            Remove
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          if (!disabled) accept(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          "rounded-xl border border-dashed px-6 py-10 text-center transition-colors",
          dragActive ? "border-brand bg-brand-subtle" : "border-slate-300 bg-slate-50/50",
          disabled && "opacity-60",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS.join(",")}
          className="sr-only"
          disabled={disabled}
          onChange={(e) => accept(e.target.files?.[0])}
        />
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-hairline bg-surface text-muted">
          <UploadCloud className="h-5 w-5" />
        </span>
        <p className="mt-3 text-sm font-semibold text-ink">Upload your resume</p>
        <p className="mt-1 text-[13px] text-muted">Drag and drop it here, or choose a file to browse.</p>
        <Button
          variant="secondary"
          size="sm"
          className="mt-4"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          Choose file
        </Button>
        <p className="mt-3 text-[13px] text-muted">PDF, PNG or JPG · up to 5MB</p>
      </div>
      {sizeError && (
        <p role="alert" className="mt-2 text-[13px] text-danger">
          {sizeError}
        </p>
      )}
    </div>
  );
}
