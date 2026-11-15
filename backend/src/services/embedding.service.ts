import { pipeline, type FeatureExtractionPipeline } from "@xenova/transformers";
import { env } from "../config/env.js";

let extractorPromise: Promise<FeatureExtractionPipeline> | null = null;

export async function embedText(text: string): Promise<number[]> {
  extractorPromise ??= pipeline("feature-extraction", env.embeddingModel) as Promise<FeatureExtractionPipeline>;
  const extractor = await extractorPromise;
  const output = await extractor(text, { pooling: "mean", normalize: true });
  return Array.from(output.data as Float32Array);
}

const QUERY_PREFIX = "Represent this sentence for searching relevant passages: ";

export async function embedQuery(text: string): Promise<number[]> {
  return embedText(`${QUERY_PREFIX}${text}`);
}
