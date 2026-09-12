import { DataType, MetricType, MilvusClient } from "@zilliz/milvus2-sdk-node";
import { env } from "../config/env.js";
import type { JobDescription, JobMatch } from "../types/index.js";

const client = new MilvusClient({
  address: env.milvusAddress,
  token: env.milvusToken,
  // The SDK's default RPC deadline is 15s, which Zilliz Cloud's managed
  // cluster (plus free-tier cold starts) can exceed on createCollection/
  // createIndex/insert calls. 60s gives it enough room.
  timeout: 60000,
});

const FIELDS = {
  id: "id",
  jobId: "job_id",
  title: "title",
  company: "company",
  description: "description",
  embedding: "embedding",
} as const;

/**
 * Creates the job_descriptions collection + a COSINE similarity index if they
 * don't already exist yet, then loads the collection into memory for search.
 * Safe to call on every server/script startup.
 */
export async function ensureCollection(): Promise<void> {
  const { value: exists } = await client.hasCollection({ collection_name: env.milvusCollection });

  if (!exists) {
    await client.createCollection({
      collection_name: env.milvusCollection,
      fields: [
        { name: FIELDS.id, data_type: DataType.Int64, is_primary_key: true, autoID: true },
        { name: FIELDS.jobId, data_type: DataType.VarChar, max_length: 64 },
        { name: FIELDS.title, data_type: DataType.VarChar, max_length: 256 },
        { name: FIELDS.company, data_type: DataType.VarChar, max_length: 256 },
        { name: FIELDS.description, data_type: DataType.VarChar, max_length: 8192 },
        { name: FIELDS.embedding, data_type: DataType.FloatVector, dim: env.embeddingDim },
      ],
    });

    await client.createIndex({
      collection_name: env.milvusCollection,
      field_name: FIELDS.embedding,
      index_type: "HNSW",
      metric_type: MetricType.COSINE,
      params: { M: 8, efConstruction: 200 },
    });
  }

  await client.loadCollectionSync({ collection_name: env.milvusCollection });
}

export async function insertJobs(jobs: (JobDescription & { embedding: number[] })[]): Promise<void> {
  await client.insert({
    collection_name: env.milvusCollection,
    fields_data: jobs.map((job) => ({
      [FIELDS.jobId]: job.jobId,
      [FIELDS.title]: job.title,
      [FIELDS.company]: job.company,
      [FIELDS.description]: job.description,
      [FIELDS.embedding]: job.embedding,
    })),
  });
}

export async function dropCollection(): Promise<void> {
  const { value: exists } = await client.hasCollection({ collection_name: env.milvusCollection });
  if (exists) {
    await client.dropCollection({ collection_name: env.milvusCollection });
  }
}

export async function countJobs(): Promise<number> {
  const stats = await client.getCollectionStatistics({ collection_name: env.milvusCollection });
  return Number(stats.data.row_count ?? 0);
}

// Zilliz Cloud serverless clusters cap the search `limit` parameter at 1024 —
// exceeding it doesn't error, it silently returns zero hits. Clamping here
// keeps TOP_K misconfiguration from ever causing that again.
const MAX_SEARCH_LIMIT = 1024;

/**
 * Runs a cosine-similarity search over the job_descriptions collection and
 * returns the top matches, best first.
 */
export async function searchJobs(embedding: number[], topK = env.topK): Promise<JobMatch[]> {
  const result = await client.search({
    collection_name: env.milvusCollection,
    data: embedding,
    limit: Math.min(topK, MAX_SEARCH_LIMIT),
    metric_type: MetricType.COSINE,
    output_fields: [FIELDS.jobId, FIELDS.title, FIELDS.company, FIELDS.description],
  });

  return result.results.map((hit) => ({
    jobId: String(hit[FIELDS.jobId]),
    title: String(hit[FIELDS.title]),
    company: String(hit[FIELDS.company]),
    description: String(hit[FIELDS.description]),
    score: hit.score,
  }));
}
