import { createHash } from "node:crypto";
import type { JobDescription } from "../types/index.js";

const API_URL = "https://www.arbeitnow.com/api/job-board-api";

// Zilliz field caps from the collection schema in milvus.service.ts — exceeding
// them makes the insert fail, so trim here at the source.
const MAX_JOB_ID = 64;
const MAX_TITLE = 256;
const MAX_COMPANY = 256;
const MAX_DESCRIPTION = 8192;

// Arbeitnow asks that the free API not be abused; a small pause between pages
// keeps us well-behaved, mirroring the DELAY_MS pattern in fetchAdzunaJobs.ts.
const DELAY_MS = 300;
const REQUEST_TIMEOUT_MS = 10000;

interface ArbeitnowJob {
  slug: string;
  company_name: string;
  title: string;
  description: string;
}

interface ArbeitnowPage {
  data: ArbeitnowJob[];
  links: { next: string | null };
}

/**
 * Arbeitnow descriptions are HTML; the embedding model wants plain prose.
 *
 * Entities are decoded *before* tags are stripped: many postings arrive
 * entity-encoded (`&lt;p&gt;`), so decoding afterwards would turn those back
 * into literal "<p>" text and feed the markup straight into the embedding.
 * `&amp;` is decoded last so "&amp;lt;" can't become a tag mid-pass.
 */
function stripHtml(html: string): string {
  return html
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Slugs run past the collection's 64-char job_id cap, and their unique numeric
// suffix sits at the *end* — plain truncation silently merged distinct jobs
// (689 slugs collapsed to 678 in testing). Keep a readable prefix and append a
// hash of the full slug so the id stays stable, unique, and within the cap.
function toJobId(slug: string): string {
  const digest = createHash("sha1").update(slug).digest("hex").slice(0, 12);
  const prefix = slug.slice(0, MAX_JOB_ID - "arbeitnow:".length - digest.length - 1).replace(/-+$/, "");
  return `arbeitnow:${prefix}-${digest}`;
}

function toJobDescription(job: ArbeitnowJob): JobDescription | null {
  const title = job.title?.trim();
  const description = stripHtml(job.description ?? "");

  // Nothing to embed without these two.
  if (!job.slug || !title || !description) return null;

  return {
    jobId: toJobId(job.slug),
    title: title.slice(0, MAX_TITLE),
    company: (job.company_name?.trim() || "Unknown").slice(0, MAX_COMPANY),
    description: description.slice(0, MAX_DESCRIPTION),
  };
}

async function fetchPage(page: number): Promise<ArbeitnowPage | null> {
  const res = await fetch(`${API_URL}?page=${page}`, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!res.ok) {
    throw new Error(`Arbeitnow responded ${res.status}`);
  }

  return (await res.json()) as ArbeitnowPage;
}

/**
 * Pulls live job postings from Arbeitnow's free public board (250 per page, no
 * API key). Stops at `maxPages` or when the API reports no next page.
 *
 * A failing page is skipped rather than aborting the whole batch — partial
 * results are still useful, since this only augments the stored job set.
 */
export async function fetchLiveJobs(maxPages: number): Promise<JobDescription[]> {
  const jobs: JobDescription[] = [];
  const seenIds = new Set<string>();
  // Arbeitnow lists the same role under several slugs (regional variants) —
  // ~10% of a pull, one role seen 23 times. Without this the user gets the
  // same job repeated through their matches, and we pay to embed each copy.
  const seenPostings = new Set<string>();

  for (let page = 1; page <= maxPages; page++) {
    let result: ArbeitnowPage | null = null;

    try {
      result = await fetchPage(page);
    } catch (err) {
      console.warn(`Arbeitnow page ${page} failed, skipping:`, err);
      continue;
    }

    for (const raw of result?.data ?? []) {
      const job = toJobDescription(raw);
      if (!job) continue;

      // Slugs can also repeat across pages as the board shifts between requests.
      const posting = `${job.company}||${job.title}`.toLowerCase();
      if (seenIds.has(job.jobId) || seenPostings.has(posting)) continue;

      seenIds.add(job.jobId);
      seenPostings.add(posting);
      jobs.push(job);
    }

    if (!result?.links?.next) break;

    if (page < maxPages) {
      await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
    }
  }

  return jobs;
}
