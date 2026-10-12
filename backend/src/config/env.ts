import "dotenv/config";

export const env = {
  port: Number(process.env.PORT ?? 4000),
  milvusAddress: process.env.MILVUS_ADDRESS ?? "localhost:19530",
  milvusToken: process.env.MILVUS_TOKEN,
  milvusCollection: process.env.MILVUS_COLLECTION ?? "job_descriptions",
  embeddingModel: process.env.EMBEDDING_MODEL ?? "Xenova/bge-small-en-v1.5",
  embeddingDim: Number(process.env.EMBEDDING_DIM ?? 384),
  topK: Number(process.env.TOP_K ?? 10000),
  frontendOrigin: process.env.FRONTEND_ORIGIN,
  // "groq" (default) or "gemini" — see services/llm/.
  llmProvider: process.env.LLM_PROVIDER ?? "groq",
  adzunaAppId: process.env.ADZUNA_APP_ID,
  adzunaAppKey: process.env.ADZUNA_APP_KEY,
  adzunaCountry: process.env.ADZUNA_COUNTRY ?? "us",
  adzunaPagesPerQuery: Number(process.env.ADZUNA_PAGES_PER_QUERY ?? 2),
  // Postings older than this are skipped at ingest — Adzuna returns listings
  // years old, and stale jobs are worse than fewer jobs.
  adzunaMaxAgeDays: Number(process.env.ADZUNA_MAX_AGE_DAYS ?? 90),
};
