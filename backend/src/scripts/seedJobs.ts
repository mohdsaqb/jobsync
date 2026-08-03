import jobs from "../data/jobs.json" with { type: "json" };
import { embedText } from "../services/embedding.service.js";
import { countJobs, dropCollection, ensureCollection, insertJobs } from "../services/milvus.service.js";
import type { JobDescription } from "../types/index.js";

const RESET = process.argv.includes("--reset");
const BATCH_SIZE = 50;

async function main() {
  if (RESET) {
    console.log("Dropping existing collection (--reset)...");
    await dropCollection();
  }

  console.log("Connecting to Milvus and preparing collection...");
  await ensureCollection();

  const existing = await countJobs();
  if (existing > 0 && !RESET) {
    console.log(`Collection already has ${existing} job(s) — skipping seed. Re-run with --reset to replace them.`);
    return;
  }

  const allJobs = jobs as JobDescription[];
  console.log(`Embedding and inserting ${allJobs.length} job descriptions in batches of ${BATCH_SIZE}...`);

  for (let i = 0; i < allJobs.length; i += BATCH_SIZE) {
    const batch = allJobs.slice(i, i + BATCH_SIZE);
    const withEmbeddings = await Promise.all(
      batch.map(async (job) => ({
        ...job,
        embedding: await embedText(`${job.title}\n${job.description}`),
      })),
    );
    await insertJobs(withEmbeddings);
    console.log(`  ${Math.min(i + BATCH_SIZE, allJobs.length)} / ${allJobs.length} inserted`);
  }

  console.log(`Done. Inserted ${allJobs.length} jobs into Milvus.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
  });
