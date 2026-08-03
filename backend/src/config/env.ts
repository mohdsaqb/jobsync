import "dotenv/config";

export const env = {
  port: Number(process.env.PORT ?? 4000),
  milvusAddress: process.env.MILVUS_ADDRESS ?? "localhost:19530",
  milvusCollection: process.env.MILVUS_COLLECTION ?? "job_descriptions",
  embeddingModel: process.env.EMBEDDING_MODEL ?? "Xenova/all-MiniLM-L6-v2",
  embeddingDim: Number(process.env.EMBEDDING_DIM ?? 384),
  topK: Number(process.env.TOP_K ?? 50),
};
