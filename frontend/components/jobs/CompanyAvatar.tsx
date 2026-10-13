import { cn } from "@/lib/cn";

/**
 * Initials on a tinted square. The job source provides no logo URL, so this is
 * an honest fallback rather than a stand-in for a real company mark.
 */
const TINTS = [
  "bg-indigo-50 text-indigo-700",
  "bg-sky-50 text-sky-700",
  "bg-emerald-50 text-emerald-700",
  "bg-amber-50 text-amber-700",
  "bg-rose-50 text-rose-700",
  "bg-violet-50 text-violet-700",
];

function initials(company: string): string {
  const words = company.replace(/[^\p{L}\p{N} ]/gu, " ").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export default function CompanyAvatar({ company, className }: { company: string; className?: string }) {
  let hash = 0;
  for (let i = 0; i < company.length; i++) hash = (hash * 31 + company.charCodeAt(i)) % TINTS.length;

  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[11px] font-semibold",
        TINTS[hash],
        className,
      )}
    >
      {initials(company)}
    </span>
  );
}
