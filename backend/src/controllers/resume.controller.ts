import fs from "node:fs/promises";
import type { Request, Response } from "express";
import { env } from "../config/env.js";
import { embedText } from "../services/embedding.service.js";
import { searchJobs } from "../services/milvus.service.js";
import { extractResumeText, TextExtractionError } from "../services/textExtraction.service.js";

const MIN_MATCH_SCORE = 0.1;

export async function analyzeResume(req: Request, res: Response): Promise<void> {
  const file = req.file;

  if (!file) {
    res.status(400).json({ error: "No resume file uploaded. Use the 'resume' form field." });
    return;
  }

  try {
    const text = await extractResumeText(file.path, file.mimetype);
    const embedding = await embedText(text);
    console.log(
      "[debug] embedding length:",
      embedding.length,
      "all-zero:",
      embedding.every((v) => v === 0),
      "sample:",
      embedding.slice(0, 5),
    );
    const matches = await searchJobs(embedding, env.topK);
    const relevantMatches = matches.filter((match) => match.score > MIN_MATCH_SCORE);

    res.json({ matches: relevantMatches, resumeText: text });
  } catch (err) {
    if (err instanceof TextExtractionError) {
      res.status(422).json({ error: err.message });
      return;
    }

    console.error("Resume analysis failed:", err);
    res.status(500).json({ error: "Something went wrong while analyzing the resume." });
  } finally {
    await fs.unlink(file.path).catch(() => {});
  }
}
