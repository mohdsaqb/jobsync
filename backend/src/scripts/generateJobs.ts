import fs from "node:fs/promises";
import type { JobDescription } from "../types/index.js";
import { deduplicateJobs } from "../services/jobIdentity.js";

import templates from "../data/jobTemplates.json" with { type: "json" };

const { seniorities, companyPrefixes, companySuffixes, roles } = templates;

type RoleTemplate = typeof roles[number];

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickRandom<T>(items: T[], count: number): T[] {
  return shuffle(items).slice(0, count);
}

function randomCompany(): string {
  const prefix = companyPrefixes[Math.floor(Math.random() * companyPrefixes.length)];
  const suffix = companySuffixes[Math.floor(Math.random() * companySuffixes.length)];
  return `${prefix} ${suffix}`;
}

function buildDescription(role: RoleTemplate, seniority: string): string {
  const intro = role.intro.replace("{seniority}", seniority ? `${seniority} ` : "");
  const responsibilities = pickRandom(role.responsibilities, 4).join(" ");
  const skills = pickRandom(role.skills, 5).join(", ");
  const niceToHave = pickRandom(role.niceToHave, 2).join(" and ");

  return `${intro} ${responsibilities} Required skills: ${skills}. Nice to have: ${niceToHave}.`;
}

const TARGET_COUNT = 10000;
const POSTINGS_PER_ROLE = Math.ceil(TARGET_COUNT / roles.length);

function generateJobs(): JobDescription[] {
  const jobs: JobDescription[] = [];
  let counter = 1;

  for (const role of roles) {
    for (let i = 0; i < POSTINGS_PER_ROLE; i++) {
      const seniority = seniorities[Math.floor(Math.random() * seniorities.length)];
      const title = seniority ? `${seniority} ${role.titleBase}` : role.titleBase;

      jobs.push({
        jobId: `jd-${String(counter).padStart(4, "0")}`,
        title,
        company: randomCompany(),
        description: buildDescription(role, seniority),
      });
      counter++;
    }
  }

  return jobs;
}

async function main() {
  const jobs = deduplicateJobs(generateJobs());
  const outputPath = new URL("../data/jobs.json", import.meta.url);
  await fs.writeFile(outputPath, JSON.stringify(jobs, null, 2));
  console.log(`Generated ${jobs.length} job descriptions across ${roles.length} roles -> ${outputPath}`);
}

main().catch((err) => {
  console.error("Job generation failed:", err);
  process.exit(1);
});
