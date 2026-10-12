import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import { env } from "./config/env.js";
import { resumeRouter } from "./routes/resume.routes.js";
import { LLM_KEY_ENV_VAR } from "./services/aiSuggestions.service.js";
import { embedText } from "./services/embedding.service.js";
import { countJobsCached, ensureCollection, isMilvusHealthy } from "./services/milvus.service.js";
import { readSyncState } from "./services/syncState.js";

// The Milvus SDK rejects promises internally during connection retries; without
// this, a transient Zilliz blip would crash the whole process.
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection (process staying up):", reason);
});

const app = express();

app.use(cors(env.frontendOrigin ? { origin: env.frontendOrigin } : undefined));
app.use(express.json({ limit: "1mb" }));

// Probed by an uptime monitor every few minutes, so the dependency check is
// cached: a liveness ping that only proves the process is running would stay
// green while Milvus was down and /analyze was failing.
let healthCache: { at: number; milvus: boolean } | null = null;
const HEALTH_TTL_MS = 30_000;

app.get("/health", async (_req, res) => {
  if (!healthCache || Date.now() - healthCache.at > HEALTH_TTL_MS) {
    healthCache = { at: Date.now(), milvus: await isMilvusHealthy() };
  }

  const corpusSize = healthCache.milvus ? await countJobsCached().catch(() => null) : null;

  res.status(healthCache.milvus ? 200 : 503).json({
    status: healthCache.milvus ? "ok" : "degraded",
    milvus: healthCache.milvus ? "ok" : "unreachable",
    corpusSize,
    lastSyncAt: readSyncState()?.lastSyncAt ?? null,
  });
});
app.use("/api/resume", resumeRouter);

// Catches multer errors and anything thrown before a route's own try/catch.
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(400).json({ error: err.message || "Request failed." });
});

async function start() {
  if (!process.env[LLM_KEY_ENV_VAR]) {
    console.warn(
      `${LLM_KEY_ENV_VAR} is not set — AI resume suggestions will be unavailable until you add one to backend/.env.`,
    );
  }

  await ensureCollection();

  // Load the embedding model before accepting traffic. It is lazily
  // initialised on first use, so without this the first upload after every
  // deploy pays the model-load cost.
  const warmStart = Date.now();
  await embedText("warmup").catch((err) => {
    console.error("Embedding warm-up failed; the first request will be slow:", err);
  });
  console.log(`Embedding model ready in ${Date.now() - warmStart}ms.`);

  app.listen(env.port, () => {
    console.log(`Resume analyser backend listening on http://localhost:${env.port}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
