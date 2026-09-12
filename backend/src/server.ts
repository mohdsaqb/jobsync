import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import { env } from "./config/env.js";
import { resumeRouter } from "./routes/resume.routes.js";
import { ensureCollection } from "./services/milvus.service.js";

// The Milvus SDK rejects promises internally during connection retries; without
// this, a transient Zilliz blip would crash the whole process.
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection (process staying up):", reason);
});

const app = express();

app.use(cors(env.frontendOrigin ? { origin: env.frontendOrigin } : undefined));
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/resume", resumeRouter);

// Catches multer errors and anything thrown before a route's own try/catch.
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(400).json({ error: err.message || "Request failed." });
});

async function start() {
  if (!process.env.GEMINI_API_KEY) {
    console.warn(
      "GEMINI_API_KEY is not set — AI resume suggestions will be unavailable until you add one to backend/.env.",
    );
  }

  await ensureCollection();
  app.listen(env.port, () => {
    console.log(`Resume analyser backend listening on http://localhost:${env.port}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
