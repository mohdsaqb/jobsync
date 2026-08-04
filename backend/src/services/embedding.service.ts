import { pipeline, type FeatureExtractionPipeline } from "@xenova/transformers";
import { env } from "../config/env.js";

let extractorPromise: Promise<FeatureExtractionPipeline> | null = null;

function getExtractor(): Promise<FeatureExtractionPipeline> {
  if (!extractorPromise) {
    extractorPromise = pipeline("feature-extraction", env.embeddingModel) as Promise<FeatureExtractionPipeline>;
  }
  return extractorPromise;
}

/**
 * Embeds text into a normalized vector using a local transformer model.
 * Mean-pooling + L2 normalization is done by the pipeline itself.
 */
export async function embedText(text: string): Promise<number[]> {
  const extractor = await getExtractor();
  const output = await extractor(text, { pooling: "mean", normalize: true });
  return Array.from(output.data as Float32Array);
}

// BGE-family retrieval models are trained asymmetrically: the *query* side
// (a resume, here) needs this instruction prefix for best results, while the
// *passage* side (job descriptions, embedded via plain embedText in
// seedJobs.ts/fetchAdzunaJobs.ts) is embedded without it. Harmless no-op for
// non-BGE models — they just treat it as literal text.
const QUERY_PREFIX = "Represent this sentence for searching relevant passages: ";

export async function embedQuery(text: string): Promise<number[]> {
  return embedText(`${QUERY_PREFIX}${text}`);
}
