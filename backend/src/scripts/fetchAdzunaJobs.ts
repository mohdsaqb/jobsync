import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import "dotenv/config";
import type { JobDescription } from "../types/index.js";

/**
 * Pulls real job postings from the Adzuna API (https://developer.adzuna.com/)
 * and appends them to data/jobs.json, alongside the existing synthetic set.
 * Run with `npm run fetch:adzuna`, then `npm run seed:reset` to push the
 * updated dataset into Milvus.
 *
 * Requires ADZUNA_APP_ID and ADZUNA_APP_KEY in backend/.env — sign up free
 * at https://developer.adzuna.com/ (instant approval, no cost).
 */

const APP_ID = process.env.ADZUNA_APP_ID;
const APP_KEY = process.env.ADZUNA_APP_KEY;
const COUNTRY = process.env.ADZUNA_COUNTRY ?? "us";
const RESULTS_PER_PAGE = 50;
const PAGES_PER_QUERY = Number(process.env.ADZUNA_PAGES_PER_QUERY ?? 2);
// Adzuna's free tier is rate-limited; this keeps requests well under it.
const DELAY_MS = 1100;

// Mirrors the role categories already in generateJobs.ts so the real
// postings broaden the same spread rather than skewing it.
const QUERIES = [
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

interface AdzunaResult {
  id: string;
  title?: string;
  company?: { display_name?: string };
  description?: string;
}

function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function clean(text: string, maxLen: number): string {
  const stripped = stripHtml(text);
  return stripped.length > maxLen ? `${stripped.slice(0, maxLen - 1)}…` : stripped;
}

async function fetchPage(query: string, page: number): Promise<AdzunaResult[]> {
  const url = new URL(`https://api.adzuna.com/v1/api/jobs/${COUNTRY}/search/${page}`);
  url.searchParams.set("app_id", APP_ID!);
  url.searchParams.set("app_key", APP_KEY!);
  url.searchParams.set("results_per_page", String(RESULTS_PER_PAGE));
  url.searchParams.set("what", query);
  url.searchParams.set("content-type", "application/json");

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`request failed (${res.status}): ${await res.text()}`);
  }
  const body = (await res.json()) as { results?: AdzunaResult[] };
  return body.results ?? [];
}

async function main() {
  if (!APP_ID || !APP_KEY) {
    console.error(
      "Missing ADZUNA_APP_ID / ADZUNA_APP_KEY in backend/.env.\n" +
        "Sign up free at https://developer.adzuna.com/ and add both to backend/.env, then re-run.",
    );
    process.exit(1);
  }

  const dataPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../data/jobs.json");
  const existing: JobDescription[] = JSON.parse(await fs.readFile(dataPath, "utf-8"));
  const seenIds = new Set(existing.map((j) => j.jobId));

  const collected: JobDescription[] = [];

  for (const query of QUERIES) {
    for (let page = 1; page <= PAGES_PER_QUERY; page++) {
      console.log(`Fetching "${query}" page ${page}/${PAGES_PER_QUERY}...`);
      let results: AdzunaResult[];
      try {
        results = await fetchPage(query, page);
      } catch (err) {
        console.error(`  skipped: ${(err as Error).message}`);
        continue;
      }

      for (const r of results) {
        if (!r.title || !r.description || !r.company?.display_name) continue;
        const jobId = `adz-${r.id}`;
        if (seenIds.has(jobId)) continue;
        seenIds.add(jobId);
        collected.push({
          jobId,
          title: clean(r.title, 256),
          company: clean(r.company.display_name, 256),
          description: clean(r.description, 8192),
        });
      }

      await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
    }
  }

  console.log(`\nFetched ${collected.length} new real job postings from Adzuna.`);

  const merged = [...existing, ...collected];
  await fs.writeFile(dataPath, `${JSON.stringify(merged, null, 2)}\n`);
  console.log(
    `Wrote ${merged.length} total jobs to data/jobs.json (${existing.length} existing + ${collected.length} new).`,
  );
  console.log("Next: run `npm run seed:reset` to push the updated dataset into Milvus.");
}

main().catch((err) => {
  console.error("Fetch failed:", err);
  process.exit(1);
});
