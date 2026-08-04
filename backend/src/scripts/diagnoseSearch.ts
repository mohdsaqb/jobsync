import { env } from "../config/env.js";
import { embedText } from "../services/embedding.service.js";
import { countJobs, searchJobs } from "../services/milvus.service.js";
import { extractResumeText } from "../services/textExtraction.service.js";

async function main() {
  console.log("MILVUS_ADDRESS:", env.milvusAddress);
  console.log("MILVUS_COLLECTION:", env.milvusCollection);
  console.log("EMBEDDING_DIM (configured):", env.embeddingDim);

  const rowCount = await countJobs();
  console.log("Row count in collection:", rowCount);

  const resumePath = process.argv[2];
  const sampleText = resumePath
    ? await extractResumeText(resumePath, "application/pdf")
    : "Senior Software Engineer with 8 years of experience in Python, JavaScript, TypeScript, React, Node.js, AWS, Docker, Kubernetes, PostgreSQL, and microservices architecture. Led teams building CI/CD pipelines.";

  console.log("Using resume text, length:", sampleText.length);
  const embedding = await embedText(sampleText);
  console.log("Embedding length (actual):", embedding.length);
  console.log("Embedding sample values:", embedding.slice(0, 5));
  console.log("Embedding all-zero?", embedding.every((v) => v === 0));

  const matches = await searchJobs(embedding, 20);
  console.log("Raw search hit count:", matches.length);
  for (const m of matches.slice(0, 20)) {
    console.log(`  score=${m.score}  title=${m.title}  company=${m.company}  jobId=${m.jobId}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Diagnostic script failed:", err);
    process.exit(1);
  });
