import { env } from "../config/env.js";
import type { JobDescription } from "../types/index.js";
import { fetchLiveJobs } from "./arbeitnow.service.js";
import { embedText } from "./embedding.service.js";
import { filterNewJobIds, insertJobs } from "./milvus.service.js";

// Concurrent embedText calls, each running local ONNX inference. This used to
// be 50 (matching seedJobs.ts, an offline one-off script) and ran *inside*
// the request path — on a memory-constrained long-running server that's
// enough concurrent tensor work to OOM-kill the whole process mid-response,
// which is exactly what happened in production (Render logs showed the
// process going silent right after "embedding N new jobs", then the client
// got a 502 with an empty body). Keep this low; slower is fine now that it
// runs in the background instead of blocking a response.
const EMBED_CONCURRENCY = 5;

// Only one refresh in flight at a time — otherwise multiple concurrent resume
// uploads would each kick off their own batch, multiplying the exact
// concurrent-embedding load that caused the OOM above.
let refreshInFlight = false;

async function embedAndCache(jobs: JobDescription[]): Promise<void> {
  const embedded: (JobDescription & { embedding: number[] })[] = [];

  for (let i = 0; i < jobs.length; i += EMBED_CONCURRENCY) {
    const batch = jobs.slice(i, i + EMBED_CONCURRENCY);
    const withEmbeddings = await Promise.all(
      batch.map(async (job) => ({
        ...job,
        // Same passage-side text/format seedJobs.ts uses, so live jobs are
        // embedded identically to the pre-seeded ones.
        embedding: await embedText(`${job.title}\n${job.description}`),
      })),
    );
    embedded.push(...withEmbeddings);
    await insertJobs(withEmbeddings);
  }
}

/**
 * Fetches jobs from a live source and caches any that aren't stored yet into
 * Milvus, for future requests to find via the normal fast stored search.
 *
 * Fire-and-forget by design: call without awaiting. It never touches the
 * response for the request that triggered it — that request only ever sees
 * the stored/cached job set. The tradeoff is deliberate: the alternative
 * (blocking the response on this) is what caused the production outage this
 * replaced. A resume upload just acts as a trigger to keep the cache warm;
 * the jobs it fetches aren't scored against that specific resume.
 */
export function refreshLiveJobsCache(): void {
  if (!env.liveJobsEnabled || refreshInFlight) return;

  refreshInFlight = true;

  (async () => {
    const fetched = await fetchLiveJobs(env.liveJobsMaxPages);
    if (fetched.length === 0) return;

    const newIds = await filterNewJobIds(fetched.map((job) => job.jobId));
    const newJobs = fetched.filter((job) => newIds.has(job.jobId));

    if (newJobs.length === 0) {
      console.log(`Live jobs: ${fetched.length} fetched, all already cached.`);
      return;
    }

    console.log(`Live jobs: caching ${newJobs.length} new of ${fetched.length} fetched...`);
    await embedAndCache(newJobs);
    console.log(`Live jobs: cached ${newJobs.length} new jobs.`);
  })()
    .catch((err) => {
      console.warn("Live job cache refresh failed:", err);
    })
    .finally(() => {
      refreshInFlight = false;
    });
}
