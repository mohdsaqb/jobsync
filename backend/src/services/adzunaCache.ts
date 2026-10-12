import type { JobDescription } from "../types/index.js";

/**
 * Short-lived cache of Adzuna searches, keyed by role + location.
 *
 * Two people asking for "react developer" in the same city within a few hours
 * should cost one API call, not two — which matters when the sustainable rate
 * is ~83 calls a day. Deliberately in-process: there is one backend instance,
 * and a restart costing a few calls is cheaper than operating a cache server.
 */

const TTL_MS = 6 * 60 * 60 * 1000;

// Bounded so an adversarial spread of queries can't grow this without limit.
const MAX_ENTRIES = 200;

interface Entry {
  at: number;
  jobs: JobDescription[];
}

const entries = new Map<string, Entry>();

function keyFor(what: string, where?: string): string {
  return `${what.trim().toLowerCase()}|${(where ?? "").trim().toLowerCase()}`;
}

/** Cached jobs for this search, or null when absent or stale. */
export function getCached(what: string, where?: string, now = Date.now()): JobDescription[] | null {
  const key = keyFor(what, where);
  const entry = entries.get(key);
  if (!entry) return null;

  if (now - entry.at > TTL_MS) {
    entries.delete(key);
    return null;
  }

  // Refresh insertion order so the hottest searches survive eviction.
  entries.delete(key);
  entries.set(key, entry);
  return entry.jobs;
}

export function setCached(what: string, where: string | undefined, jobs: JobDescription[], now = Date.now()): void {
  const key = keyFor(what, where);
  entries.delete(key);
  entries.set(key, { at: now, jobs });

  while (entries.size > MAX_ENTRIES) {
    // Map iteration is insertion-ordered, so this drops the least recently used.
    const oldest = entries.keys().next().value;
    if (oldest === undefined) break;
    entries.delete(oldest);
  }
}

export function cacheSize(): number {
  return entries.size;
}

/** Test seam. */
export function clearCache(): void {
  entries.clear();
}
