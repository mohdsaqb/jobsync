import { isAdzunaConfigured, searchAdzuna } from "./adzuna.service.js";
import { tryConsume } from "./adzunaBudget.js";
import { getCached, setCached } from "./adzunaCache.js";
import { embedText } from "./embedding.service.js";
import { findExistingJobIds, insertJobs } from "./milvus.service.js";

/**
 * Indexes fresh postings for a role in the background.
 *
 * Adzuna takes 3-7 seconds per page and embedding the results takes another
 * second or so, which is far too long to hold a request that otherwise
 * finishes in under half a second. So /analyze answers immediately from the
 * index and this runs after the response: the searcher's own next attempt, and
 * everyone else looking for that role, sees the new postings.
 *
 * Every failure path is swallowed — a warm that doesn't happen is invisible to
 * the user, whereas a rejected promise here would be a crash in a request that
 * has already succeeded.
 */

const PAGES = 1;
const EMBED_BATCH = 50;

/** Roles currently being warmed, so concurrent uploads don't duplicate the work. */
const inFlight = new Set<string>();

function keyFor(role: string, location?: string): string {
  return `${role.trim().toLowerCase()}|${(location ?? "").trim().toLowerCase()}`;
}

async function warm(role: string, location: string | undefined, key: string): Promise<void> {
  try {
    const { jobs, fetched, stale } = await searchAdzuna({ what: role, where: location, page: PAGES });

    // Cache even an empty result: it records that this role was just checked,
    // so the next request doesn't spend another call on it.
    setCached(role, location, jobs);

    if (jobs.length === 0) {
      console.log(`[warm] "${role}" — nothing fresh (${fetched} fetched, ${stale} stale)`);
      return;
    }

    const existing = await findExistingJobIds(jobs.map((job) => job.jobId));
    const toInsert = jobs.filter((job) => !existing.has(job.jobId));

    for (let i = 0; i < toInsert.length; i += EMBED_BATCH) {
      const batch = toInsert.slice(i, i + EMBED_BATCH);
      const withEmbeddings = await Promise.all(
        batch.map(async (job) => ({
          ...job,
          embedding: await embedText(`${job.title}\n${job.description}`),
        })),
      );
      await insertJobs(withEmbeddings);
    }

    console.log(
      `[warm] "${role}"${location ? ` in ${location}` : ""} — indexed ${toInsert.length} new of ${jobs.length} fresh`,
    );
  } catch (err) {
    console.error(`[warm] "${role}" failed:`, (err as Error).message);
  } finally {
    inFlight.delete(key);
  }
}

/**
 * Kicks off a background warm for this role if it's worth doing. Returns
 * whether one started, so the response can say so.
 */
export function warmRole(role: string, location?: string): boolean {
  const trimmed = role.trim();
  if (!trimmed || !isAdzunaConfigured()) return false;

  const key = keyFor(trimmed, location);
  if (inFlight.has(key)) return false;

  // Already fetched recently — the postings are in the index.
  if (getCached(trimmed, location)) return false;

  // One page per warm; skipped silently when the day's allowance is gone.
  if (!tryConsume(1, "live")) return false;

  inFlight.add(key);
  void warm(trimmed, location, key);
  return true;
}

/** Test seam. */
export function warmsInFlight(): number {
  return inFlight.size;
}
