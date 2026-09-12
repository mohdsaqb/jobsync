import { pipeline, type FeatureExtractionPipeline } from "@xenova/transformers";
import { env } from "../config/env.js";

let extractorPromise: Promise<FeatureExtractionPipeline> | null = null;

function getExtractor(): Promise<FeatureExtractionPipeline> {
  if (!extractorPromise) {
    extractorPromise = pipeline("feature-extraction", env.embeddingModel) as Promise<FeatureExtractionPipeline>;
  }
  return extractorPromise;
}

/** Embeds text into an L2-normalized vector using a local transformer model. */
export async function embedText(text: string): Promise<number[]> {
  const extractor = await getExtractor();
  const output = await extractor(text, { pooling: "mean", normalize: true });
  return Array.from(output.data as Float32Array);
}

// BGE models are trained asymmetrically: queries (resumes) need this prefix,
// passages (job descriptions, embedded via plain embedText) don't.
const QUERY_PREFIX = "Represent this sentence for searching relevant passages: ";

export async function embedQuery(text: string): Promise<number[]> {
  return embedText(`${QUERY_PREFIX}${text}`);
}
