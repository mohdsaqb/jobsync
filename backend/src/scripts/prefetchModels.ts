import { createWorker } from "tesseract.js";
import { embedText } from "../services/embedding.service.js";

/**
 * Downloads the model files the app otherwise fetches on first use, so they
 * are baked into the deployment image instead.
 *
 * Without this the first visitor after every deploy waits on a ~34MB ONNX
 * download (every request path) and, for image uploads, Tesseract's language
 * data — a cold start on an "always-on" host.
 *
 * Run at image build time: `node dist/scripts/prefetchModels.js`.
 */

async function main() {
  console.log("Fetching embedding model...");
  const started = Date.now();
  const vector = await embedText("warmup");
  console.log(`  ok — ${vector.length} dimensions in ${Date.now() - started}ms`);

  console.log("Fetching Tesseract language data...");
  const ocrStarted = Date.now();
  // Creating the worker is what pulls down the wasm core and eng.traineddata;
  // no recognition pass is needed.
  const worker = await createWorker("eng");
  await worker.terminate();
  console.log(`  ok — in ${Date.now() - ocrStarted}ms`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Model prefetch failed:", err);
    process.exit(1);
  });
