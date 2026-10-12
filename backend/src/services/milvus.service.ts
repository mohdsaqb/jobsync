import { ConsistencyLevelEnum, DataType, MetricType, MilvusClient } from "@zilliz/milvus2-sdk-node";
import { env } from "../config/env.js";
import type { JobDescription, JobMatch } from "../types/index.js";

const client = new MilvusClient({
  address: env.milvusAddress,
  token: env.milvusToken,
  // The SDK's 15s default is too tight for Zilliz Cloud cold starts.
  timeout: 60000,
});

const FIELDS = {
  id: "id",
  jobId: "job_id",
  title: "title",
  company: "company",
  description: "description",
  url: "url",
  location: "location",
  salaryMin: "salary_min",
  salaryMax: "salary_max",
  createdAt: "created_at",
  embedding: "embedding",
} as const;

/** Fields returned alongside a search hit — everything except the vector itself. */
const OUTPUT_FIELDS = [
  FIELDS.jobId,
  FIELDS.title,
  FIELDS.company,
  FIELDS.description,
  FIELDS.url,
  FIELDS.location,
  FIELDS.salaryMin,
  FIELDS.salaryMax,
  FIELDS.createdAt,
];

function nowInSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * Milvus can't alter a schema in place, so a collection created before the
 * url/location/salary fields existed would fail on insert and on search in
 * ways that don't name the real cause. Fail early with the fix instead.
 */
async function assertSchemaIsCurrent(): Promise<void> {
  const described = await client.describeCollection({ collection_name: env.milvusCollection });
  const present = new Set(described.schema.fields.map((field) => field.name));
  const missing = Object.values(FIELDS).filter((name) => !present.has(name));

  if (missing.length > 0) {
    throw new Error(
      `Collection "${env.milvusCollection}" is missing field(s): ${missing.join(", ")}. ` +
        "It predates the current schema, and Milvus cannot add fields to an existing " +
        "collection — re-create it with `npm run seed:reset`.",
    );
  }
}

/** Creates the collection + COSINE index if missing, then loads it for search. */
export async function ensureCollection(): Promise<void> {
  const { value: exists } = await client.hasCollection({ collection_name: env.milvusCollection });

  if (exists) {
    await assertSchemaIsCurrent();
  } else {
    await client.createCollection({
      collection_name: env.milvusCollection,
      fields: [
        { name: FIELDS.id, data_type: DataType.Int64, is_primary_key: true, autoID: true },
        { name: FIELDS.jobId, data_type: DataType.VarChar, max_length: 64 },
        { name: FIELDS.title, data_type: DataType.VarChar, max_length: 256 },
        { name: FIELDS.company, data_type: DataType.VarChar, max_length: 256 },
        { name: FIELDS.description, data_type: DataType.VarChar, max_length: 8192 },
        { name: FIELDS.url, data_type: DataType.VarChar, max_length: 1024 },
        { name: FIELDS.location, data_type: DataType.VarChar, max_length: 256 },
        { name: FIELDS.salaryMin, data_type: DataType.Float },
        { name: FIELDS.salaryMax, data_type: DataType.Float },
        { name: FIELDS.createdAt, data_type: DataType.Int64 },
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
  // Milvus has no nullable columns, so the fields only real postings carry are
  // defaulted here rather than at every call site.
  const insertedAt = nowInSeconds();

  await client.insert({
    collection_name: env.milvusCollection,
    fields_data: jobs.map((job) => ({
      [FIELDS.jobId]: job.jobId,
      [FIELDS.title]: job.title,
      [FIELDS.company]: job.company,
      [FIELDS.description]: job.description,
      [FIELDS.url]: job.url ?? "",
      [FIELDS.location]: job.location ?? "",
      [FIELDS.salaryMin]: job.salaryMin ?? 0,
      [FIELDS.salaryMax]: job.salaryMax ?? 0,
      [FIELDS.createdAt]: job.createdAt ?? insertedAt,
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

/**
 * Seals the current growing segment. Row counts and delete expressions only
 * see flushed data, so writers must flush before reporting or evicting.
 */
export async function flushCollection(): Promise<void> {
  await client.flushSync({ collection_names: [env.milvusCollection] });
}

/**
 * Live row count. Deliberately a `count(*)` query rather than
 * getCollectionStatistics: Milvus deletes are tombstones until compaction, so
 * the statistic over-reports after an eviction while this does not.
 */
export async function countJobs(): Promise<number> {
  const result = await client.query({
    collection_name: env.milvusCollection,
    expr: "",
    output_fields: ["count(*)"],
    consistency_level: ConsistencyLevelEnum.Strong,
  });
  return Number(result.data?.[0]?.["count(*)"] ?? 0);
}

/**
 * Which of the supplied job ids are already indexed. Milvus has no uniqueness
 * constraint, so dedup before insert has to be explicit or postings arrive
 * twice on every sync.
 */
export async function findExistingJobIds(jobIds: string[]): Promise<Set<string>> {
  const found = new Set<string>();
  if (jobIds.length === 0) return found;

  // A single `in` expression with thousands of ids is rejected for length, so
  // the lookup is chunked.
  const CHUNK = 200;
  for (let i = 0; i < jobIds.length; i += CHUNK) {
    const chunk = jobIds.slice(i, i + CHUNK);
    const expr = `${FIELDS.jobId} in [${chunk.map((id) => JSON.stringify(id)).join(", ")}]`;
    const result = await client.query({
      collection_name: env.milvusCollection,
      expr,
      output_fields: [FIELDS.jobId],
      limit: chunk.length,
      // Query defaults to Bounded consistency, which can be seconds stale. A
      // stale read here would re-insert postings that are already indexed.
      consistency_level: ConsistencyLevelEnum.Strong,
    });
    for (const row of result.data ?? []) {
      found.add(String(row[FIELDS.jobId]));
    }
  }

  return found;
}

/** Removes postings published before `cutoff` (epoch seconds). Returns the count deleted. */
export async function deleteJobsOlderThan(cutoff: number): Promise<number> {
  const expr = `${FIELDS.createdAt} < ${Math.floor(cutoff)}`;
  const result = await client.deleteEntities({ collection_name: env.milvusCollection, expr });
  return Number(result.delete_cnt ?? 0);
}

/**
 * Points `alias` at `collectionName`, creating the alias if it doesn't exist.
 * Readers querying the alias switch over atomically, so a rebuilt collection
 * can be swapped in without anyone seeing a half-filled index.
 */
export async function pointAliasAt(alias: string, collectionName: string): Promise<void> {
  const existing = await client.listAliases({ collection_name: collectionName });
  const aliases: string[] = (existing as { aliases?: string[] }).aliases ?? [];

  if (aliases.includes(alias)) return;

  try {
    await client.alterAlias({ collection_name: collectionName, alias });
  } catch {
    await client.createAlias({ collection_name: collectionName, alias });
  }
}

// Zilliz Cloud caps search limit at 1024 — going over silently returns 0 hits.
const MAX_SEARCH_LIMIT = 1024;

/** Cosine-similarity search over the collection, best matches first. */
export async function searchJobs(embedding: number[], topK = env.topK): Promise<JobMatch[]> {
  const result = await client.search({
    collection_name: env.milvusCollection,
    data: embedding,
    limit: Math.min(topK, MAX_SEARCH_LIMIT),
    metric_type: MetricType.COSINE,
    output_fields: OUTPUT_FIELDS,
  });

  return result.results.map((hit) => ({
    jobId: String(hit[FIELDS.jobId]),
    title: String(hit[FIELDS.title]),
    company: String(hit[FIELDS.company]),
    description: String(hit[FIELDS.description]),
    url: String(hit[FIELDS.url] ?? ""),
    location: String(hit[FIELDS.location] ?? ""),
    salaryMin: Number(hit[FIELDS.salaryMin] ?? 0),
    salaryMax: Number(hit[FIELDS.salaryMax] ?? 0),
    createdAt: Number(hit[FIELDS.createdAt] ?? 0),
    score: hit.score,
  }));
}
