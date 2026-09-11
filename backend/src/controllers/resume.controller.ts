import fs from "node:fs/promises";
import type { Request, Response } from "express";
import { env } from "../config/env.js";
import { embedQuery } from "../services/embedding.service.js";
import { getLiveMatches } from "../services/liveJobs.service.js";
import { searchJobs } from "../services/milvus.service.js";
import { extractSkills, skillOverlapScore } from "../services/skillMatch.service.js";
import { extractResumeText, TextExtractionError } from "../services/textExtraction.service.js";

const MIN_MATCH_SCORE = 0.1;

// Blend weights for the final ranking score. Semantic similarity captures
// overall topical/contextual fit; skill overlap corrects for cases where a
// handful of stray keywords (e.g. "deployed with Docker" in a MERN resume)
// would otherwise drag an unrelated job category to the top.
const SEMANTIC_WEIGHT = 0.6;
const SKILL_WEIGHT = 0.4;

export async function analyzeResume(req: Request, res: Response): Promise<void> {
  const file = req.file;

  if (!file) {
    res.status(400).json({ error: "No resume file uploaded. Use the 'resume' form field." });
    return;
  }

  try {
    const text = await extractResumeText(file.path, file.mimetype);
    const embedding = await embedQuery(text);
    // The stored-collection search is fast; the live pull may fetch and embed
    // jobs we've never seen. Run them together so the live source only costs
    // the difference, not the sum.
    const [storedMatches, liveMatches] = await Promise.all([
      searchJobs(embedding, env.topK),
      getLiveMatches(embedding),
    ]);

    // getLiveMatches only returns jobs that weren't cached yet, so overlap
    // should be empty — dedupe anyway in case a concurrent request cached the
    // same posting in between.
    const seen = new Set<string>();
    const matches = [...storedMatches, ...liveMatches].filter((match) => {
      if (seen.has(match.jobId)) return false;
      seen.add(match.jobId);
      return true;
    });

    const resumeSkills = extractSkills(text);
    const rescored = matches
      .map((match) => {
        const jobSkills = extractSkills(`${match.title} ${match.description}`);
        const overlap = skillOverlapScore(resumeSkills, jobSkills);
        return { ...match, score: SEMANTIC_WEIGHT * match.score + SKILL_WEIGHT * overlap };
      })
      .sort((a, b) => b.score - a.score);

    const relevantMatches = rescored.filter((match) => match.score > MIN_MATCH_SCORE);

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
