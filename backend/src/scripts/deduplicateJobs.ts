import fs from "node:fs/promises";
import { deduplicateJobs } from "../services/jobIdentity.js";
import type { JobDescription } from "../types/index.js";

async function main() {
  const dataPath = new URL("../data/jobs.json", import.meta.url);
  const jobs: JobDescription[] = JSON.parse(await fs.readFile(dataPath, "utf-8"));
  const unique = deduplicateJobs(jobs);
  await fs.writeFile(dataPath, `${JSON.stringify(unique, null, 2)}\n`);
  console.log(`Removed ${jobs.length - unique.length} duplicates; ${unique.length} unique jobs remain.`);
}

main().catch((error) => {
  console.error("Job cleanup failed:", error);
  process.exitCode = 1;
});
