import "dotenv/config";

export const env = {
  port: Number(process.env.PORT ?? 4000),
  milvusAddress: process.env.MILVUS_ADDRESS ?? "localhost:19530",
  milvusToken: process.env.MILVUS_TOKEN,
  milvusCollection: process.env.MILVUS_COLLECTION ?? "job_descriptions",
  embeddingModel: process.env.EMBEDDING_MODEL ?? "Xenova/all-MiniLM-L6-v2",
  embeddingDim: Number(process.env.EMBEDDING_DIM ?? 384),
  topK: Number(process.env.TOP_K ?? 10000),
  frontendOrigin: process.env.FRONTEND_ORIGIN,
};
