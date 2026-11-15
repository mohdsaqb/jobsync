import jobs from "../data/jobs.json" with { type: "json" };
import type { JobDescription } from "../types/index.js";
import { postingUrl } from "./jobIdentity.js";

const catalog = new Map<string, JobDescription>(jobs.map((job) => [job.jobId, job]));

/** Keep source metadata in the catalog so existing Milvus schemas still work. */
export function withCatalogMetadata<T extends JobDescription>(job: T, source = catalog.get(job.jobId)): T {
  if (!source) return job;
  return {
    ...job,
    url: postingUrl(source.url),
    location: source.location,
    salaryMin: source.salaryMin,
    salaryMax: source.salaryMax,
    createdAt: source.createdAt,
  };
}
