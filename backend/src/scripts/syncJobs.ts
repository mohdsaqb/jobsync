import "dotenv/config";
import { env } from "../config/env.js";
import { isAdzunaConfigured, searchAdzuna, SYNC_QUERIES } from "../services/adzuna.service.js";
import { remaining, tryConsume } from "../services/adzunaBudget.js";
import { embedText } from "../services/embedding.service.js";
import {
  countJobs,
  deleteJobsOlderThan,
  ensureCollection,
  findExistingJobIds,
  flushCollection,
  insertJobs,
} from "../services/milvus.service.js";
import { writeSyncState } from "../services/syncState.js";
import type { JobDescription } from "../types/index.js";

/**
 * Pulls fresh postings from Adzuna into Milvus, skipping anything already
 * indexed and evicting listings that have aged out.
 *
 * Designed to run on a schedule rather than in the request path: embedding a
 * few hundred postings needs real CPU, and Adzuna takes 3-7s per page.
 *
 * Writes into whichever collection MILVUS_COLLECTION names, so a replacement
 * corpus can be built alongside the live one and swapped in via an alias.
 *
 *   npm run sync:jobs                      -- normal run
 *   npm run sync:jobs -- --max-calls=4     -- small run, for checking output
 *   MILVUS_COLLECTION=job_descriptions_v2 npm run sync:jobs
 */

const EMBED_BATCH = 50;

// The free tier allows 25 calls/minute, i.e. one every 2.4s. (The older
// fetchAdzunaJobs script used 1.1s, which was over that ceiling.)
const DELAY_MS = 2_500;

function intArg(name: string, fallback: number): number {
  const raw = process.argv.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  if (!isAdzunaConfigured()) {
    console.error(
      "Missing ADZUNA_APP_ID / ADZUNA_APP_KEY in backend/.env.\n" +
        "Sign up free at https://developer.adzuna.com/, add both, then re-run.",
    );
    process.exit(1);
  }

  const pagesPerQuery = intArg("pages", env.adzunaPagesPerQuery);
  const maxCalls = intArg("max-calls", Number.MAX_SAFE_INTEGER);

  console.log(`Syncing "${env.milvusCollection}" from Adzuna (${env.adzunaCountry}).`);
  console.log(`Budget available: ${JSON.stringify(remaining().channels)}, day=${remaining().day}`);

  await ensureCollection();

  const collected = new Map<string, JobDescription>();
  let callsUsed = 0;
  let fetched = 0;
  let stale = 0;
  let incomplete = 0;
  let budgetExhausted = false;

  outer: for (let page = 1; page <= pagesPerQuery; page++) {
    for (const query of SYNC_QUERIES) {
      if (callsUsed >= maxCalls) break outer;
      if (!tryConsume(1, "sync")) {
        budgetExhausted = true;
        break outer;
      }

      callsUsed++;
      try {
        const result = await searchAdzuna({ what: query, page });
        fetched += result.fetched;
        stale += result.stale;
        incomplete += result.incomplete;
        for (const job of result.jobs) {
          collected.set(job.jobId, job);
        }
        console.log(
          `  [${callsUsed}] "${query}" p${page}: ${result.jobs.length} fresh of ${result.fetched} ` +
            `(${result.stale} stale) — ${collected.size} unique so far`,
        );
      } catch (err) {
        // One bad page shouldn't abandon the run; the call is still spent.
        console.error(`  [${callsUsed}] "${query}" p${page} skipped: ${(err as Error).message}`);
      }

      await sleep(DELAY_MS);
    }
  }

  if (budgetExhausted) {
    console.log("Stopped early: Adzuna budget for this window is spent.");
  }

  const candidates = [...collected.values()];
  console.log(`\nFetched ${fetched} results across ${callsUsed} calls -> ${candidates.length} unique fresh postings.`);

  const alreadyIndexed = await findExistingJobIds(candidates.map((job) => job.jobId));
  const toInsert = candidates.filter((job) => !alreadyIndexed.has(job.jobId));
  console.log(`${alreadyIndexed.size} already indexed, ${toInsert.length} new.`);

  for (let i = 0; i < toInsert.length; i += EMBED_BATCH) {
    const batch = toInsert.slice(i, i + EMBED_BATCH);
    const withEmbeddings = await Promise.all(
      batch.map(async (job) => ({
        ...job,
        embedding: await embedText(`${job.title}\n${job.description}`),
      })),
    );
    await insertJobs(withEmbeddings);
    console.log(`  ${Math.min(i + EMBED_BATCH, toInsert.length)} / ${toInsert.length} inserted`);
  }

  // Row counts and delete expressions only see flushed data.
  await flushCollection();

  // Anything past the ingest window is no longer worth matching against.
  const cutoff = Math.floor(Date.now() / 1000) - env.adzunaMaxAgeDays * 24 * 60 * 60;
  const evicted = await deleteJobsOlderThan(cutoff);
  console.log(`Evicted ${evicted} posting(s) older than ${env.adzunaMaxAgeDays} days.`);

  const corpusSize = await countJobs();
  writeSyncState({
    lastSyncAt: Math.floor(Date.now() / 1000),
    inserted: toInsert.length,
    evicted,
    corpusSize,
    callsUsed,
  });

  console.log(`\nDone. Inserted ${toInsert.length}, evicted ${evicted}. Corpus now ${corpusSize}.`);
  console.log(`Adzuna calls used: ${callsUsed}. Remaining today: ${remaining().channels.sync} (sync channel).`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Sync failed:", err);
    process.exit(1);
  });
