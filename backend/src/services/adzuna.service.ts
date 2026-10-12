import { env } from "../config/env.js";
import type { JobDescription } from "../types/index.js";

/**
 * Client for the Adzuna job-search API (https://developer.adzuna.com/).
 * Shared by the scheduled sync and the on-demand fetch in the request path,
 * so both produce identically shaped records.
 *
 * Requires ADZUNA_APP_ID and ADZUNA_APP_KEY in backend/.env — free signup,
 * instant approval.
 */

const RESULTS_PER_PAGE = 50;

/** Field caps match the Milvus VarChar lengths in milvus.service.ts. */
const MAX_TITLE = 256;
const MAX_COMPANY = 256;
const MAX_DESCRIPTION = 8192;
const MAX_URL = 1024;
const MAX_LOCATION = 256;

export class AdzunaNotConfiguredError extends Error {}

interface AdzunaResult {
  id: string;
  title?: string;
  company?: { display_name?: string };
  description?: string;
  redirect_url?: string;
  location?: { display_name?: string };
  salary_min?: number;
  salary_max?: number;
  created?: string;
}

export interface AdzunaSearchParams {
  what: string;
  where?: string;
  page?: number;
}

export interface AdzunaSearchResult {
  jobs: JobDescription[];
  /** Raw results Adzuna returned, before filtering. */
  fetched: number;
  /** Dropped for being older than the age window. */
  stale: number;
  /** Dropped for missing a title, body or employer. */
  incomplete: number;
}

export function isAdzunaConfigured(): boolean {
  return Boolean(env.adzunaAppId && env.adzunaAppKey);
}

function stripHtml(text: string): string {
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function clean(text: string, maxLen: number): string {
  const stripped = stripHtml(text);
  return stripped.length > maxLen ? `${stripped.slice(0, maxLen - 1)}…` : stripped;
}

type Rejection = "incomplete" | "stale";

/**
 * Adzuna's corpus reaches back years — measured against live results, the
 * median posting is ~50 days old and the 75th percentile is over 500. Stale
 * listings are filtered at ingest rather than evicted later, because a job
 * posted years ago is noise in a feed that advertises fresh roles.
 */
function toJob(result: AdzunaResult, now: number): JobDescription | Rejection {
  // A posting with no title, body or employer is not worth indexing.
  if (!result.title || !result.description || !result.company?.display_name) return "incomplete";

  const parsed = result.created ? Date.parse(result.created) : Number.NaN;
  // Some postings carry a timestamp slightly in the future; treat those as new.
  const createdMs = Number.isNaN(parsed) ? now : Math.min(parsed, now);

  if (now - createdMs > env.adzunaMaxAgeDays * 24 * 60 * 60 * 1000) return "stale";

  return {
    jobId: `adz-${result.id}`,
    title: clean(result.title, MAX_TITLE),
    company: clean(result.company.display_name, MAX_COMPANY),
    description: clean(result.description, MAX_DESCRIPTION),
    url: result.redirect_url ? clean(result.redirect_url, MAX_URL) : "",
    location: result.location?.display_name ? clean(result.location.display_name, MAX_LOCATION) : "",
    salaryMin: result.salary_min ?? 0,
    salaryMax: result.salary_max ?? 0,
    createdAt: Math.floor(createdMs / 1000),
  };
}

/**
 * One page of results for a query. Throws on a non-2xx response so callers can
 * decide whether to skip the page or abandon the run.
 */
export async function searchAdzuna({ what, where, page = 1 }: AdzunaSearchParams): Promise<AdzunaSearchResult> {
  if (!isAdzunaConfigured()) {
    throw new AdzunaNotConfiguredError(
      "ADZUNA_APP_ID and ADZUNA_APP_KEY are required. Sign up free at https://developer.adzuna.com/.",
    );
  }

  const url = new URL(`https://api.adzuna.com/v1/api/jobs/${env.adzunaCountry}/search/${page}`);
  url.searchParams.set("app_id", env.adzunaAppId!);
  url.searchParams.set("app_key", env.adzunaAppKey!);
  url.searchParams.set("results_per_page", String(RESULTS_PER_PAGE));
  url.searchParams.set("what", what);
  url.searchParams.set("content-type", "application/json");
  if (where) {
    url.searchParams.set("where", where);
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Adzuna request failed (${response.status}): ${await response.text()}`);
  }

  const body = (await response.json()) as { results?: AdzunaResult[] };
  const results = body.results ?? [];

  const now = Date.now();
  const jobs: JobDescription[] = [];
  let stale = 0;
  let incomplete = 0;

  for (const result of results) {
    const job = toJob(result, now);
    if (job === "stale") stale++;
    else if (job === "incomplete") incomplete++;
    else jobs.push(job);
  }

  return { jobs, fetched: results.length, stale, incomplete };
}

/**
 * Queries the scheduled sync walks to build a broad corpus. Mirrors the role
 * categories in generateJobs.ts so real postings widen the same spread rather
 * than skewing it.
 */
export const SYNC_QUERIES = [
  "software engineer", "frontend developer", "backend developer", "full stack engineer",
  "MERN stack developer", "MEAN stack developer", "react developer", "node.js developer",
  "javascript developer", "typescript developer", "web developer",
  "devops engineer", "site reliability engineer", "data engineer", "data scientist",
  "machine learning engineer", "cloud engineer", "network engineer", "database administrator",
  "qa engineer", "security analyst", "product manager", "business analyst",
  "hr generalist", "sales executive", "accountant", "financial analyst",
  "marketing analyst", "customer support representative", "retail store manager", "restaurant manager",
  "registered nurse", "pharmacist", "teacher", "civil engineer", "mechanical engineer",
  "electrical engineer", "warehouse associate", "truck driver", "electrician", "plumber",
];
