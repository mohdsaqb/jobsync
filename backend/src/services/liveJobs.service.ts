import { env } from "../config/env.js";
import type { JobDescription, JobMatch } from "../types/index.js";
import { fetchLiveJobs } from "./arbeitnow.service.js";
import { embedText } from "./embedding.service.js";
import { filterNewJobIds, insertJobs } from "./milvus.service.js";

const BATCH_SIZE = 50;

/**
 * Cosine similarity via dot product. Both sides come from embedText, which
 * L2-normalizes its output, so the dot product *is* the cosine — the same
 * metric the Milvus collection is indexed with.
 */
function cosineSimilarity(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

async function embedJobs(jobs: JobDescription[]): Promise<(JobDescription & { embedding: number[] })[]> {
  const embedded: (JobDescription & { embedding: number[] })[] = [];

  for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
    const batch = jobs.slice(i, i + BATCH_SIZE);
    const withEmbeddings = await Promise.all(
      batch.map(async (job) => ({
        ...job,
        // Same passage-side text/format seedJobs.ts uses, so live jobs are
        // embedded identically to the pre-seeded ones.
        embedding: await embedText(`${job.title}\n${job.description}`),
      })),
    );
    embedded.push(...withEmbeddings);
  }

  return embedded;
}

/**
 * Fetches jobs from a live source, embeds and caches any that aren't stored
 * yet, and scores them against the resume for this request.
 *
 * Only *newly discovered* jobs are returned — ones cached by earlier requests
 * already come back through the normal Milvus search, so returning them here
 * too would just duplicate them.
 *
 * This augments the stored search, so any failure is logged and swallowed:
 * a live-source outage must never break resume analysis.
 */
export async function getLiveMatches(queryEmbedding: number[]): Promise<JobMatch[]> {
  if (!env.liveJobsEnabled) return [];

  try {
    const fetched = await fetchLiveJobs(env.liveJobsMaxPages);
    if (fetched.length === 0) return [];

    const newIds = await filterNewJobIds(fetched.map((job) => job.jobId));
    const newJobs = fetched.filter((job) => newIds.has(job.jobId));

    if (newJobs.length === 0) {
      console.log(`Live jobs: ${fetched.length} fetched, all already cached.`);
      return [];
    }

    console.log(`Live jobs: embedding ${newJobs.length} new of ${fetched.length} fetched...`);
    const embedded = await embedJobs(newJobs);

    // Cache for future requests. If this fails the matches are still valid for
    // *this* response — we just pay the embedding cost again next time.
    try {
      for (let i = 0; i < embedded.length; i += BATCH_SIZE) {
        await insertJobs(embedded.slice(i, i + BATCH_SIZE));
      }
    } catch (err) {
      console.warn("Caching live jobs to Milvus failed:", err);
    }

    return embedded.map(({ embedding, ...job }) => ({
      ...job,
      score: cosineSimilarity(queryEmbedding, embedding),
    }));
  } catch (err) {
    console.warn("Live job search failed, falling back to stored jobs only:", err);
    return [];
  }
}
