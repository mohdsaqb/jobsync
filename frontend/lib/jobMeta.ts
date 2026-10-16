/**
 * Formatting for the fields that only real postings carry. Synthetic records
 * leave them empty, so every helper degrades to null rather than rendering a
 * placeholder.
 */

/**
 * Compact annual pay, e.g. "20L – 25L" in en-IN or "2M – 2.5M" in en-US.
 * Deliberately unitless: the source reports figures in the local currency of
 * whichever Adzuna country is configured, which the client doesn't know.
 */
export function formatSalary(min?: number, max?: number): string | null {
  const low = min && min > 0 ? min : null;
  const high = max && max > 0 ? max : null;
  if (!low && !high) return null;

  const compact = (n: number) =>
    new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(n);

  if (low && high) return low === high ? compact(low) : `${compact(low)} – ${compact(high)}`;
  return low ? `from ${compact(low)}` : `up to ${compact(high as number)}`;
}

/** Relative age of a posting, e.g. "today", "3d ago", "5w ago". */
export function formatPostedAge(createdAt?: number, now = Date.now()): string | null {
  if (!createdAt || createdAt <= 0) return null;

  const days = Math.floor((now / 1000 - createdAt) / 86_400);
  if (days < 0) return null;
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 56) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

