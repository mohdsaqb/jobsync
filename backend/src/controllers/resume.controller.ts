import fs from "node:fs/promises";
import type { Request, Response } from "express";
import { env } from "../config/env.js";
import { embedQuery } from "../services/embedding.service.js";
import { warmRole } from "../services/jobWarmer.js";
import { countJobsCached, searchJobs } from "../services/milvus.service.js";
import { extractSkills, skillOverlapScore } from "../services/skillMatch.service.js";
import { readSyncState } from "../services/syncState.js";
import { extractResumeText, TextExtractionError } from "../services/textExtraction.service.js";

const MIN_MATCH_SCORE = 0.1;

// Final score blends semantic fit with explicit skill overlap (see skillMatch.service.ts).
const SEMANTIC_WEIGHT = 0.6;
const SKILL_WEIGHT = 0.4;

const MAX_ROLE_LENGTH = 200;
const MAX_LOCATION_LENGTH = 120;

/** Optional free-text hints, ignored unless they're usable strings. */
function optionalField(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed && trimmed.length <= maxLength ? trimmed : undefined;
}

export async function analyzeResume(req: Request, res: Response): Promise<void> {
  const file = req.file;

  if (!file) {
    res.status(400).json({ error: "No resume file uploaded. Use the 'resume' form field." });
    return;
  }

  try {
    const text = await extractResumeText(file.path, file.mimetype);
    const embedding = await embedQuery(text);
    const matches = await searchJobs(embedding, env.topK);

    const resumeSkills = extractSkills(text);
    const rescored = matches
      .map((match) => {
        const jobSkills = extractSkills(`${match.title} ${match.description}`);
        const overlap = skillOverlapScore(resumeSkills, jobSkills);
        return { ...match, score: SEMANTIC_WEIGHT * match.score + SKILL_WEIGHT * overlap };
      })
      .sort((a, b) => b.score - a.score);

    const relevantMatches = rescored.filter((match) => match.score > MIN_MATCH_SCORE);

    // Fetching from Adzuna takes several seconds, so it happens after this
    // response rather than inside it — the postings land in the index for the
    // next search instead of making this one slow.
    const targetRole = optionalField(req.body?.targetRole, MAX_ROLE_LENGTH);
    const location = optionalField(req.body?.location, MAX_LOCATION_LENGTH);
    const warming = targetRole ? warmRole(targetRole, location) : false;

    res.json({
      matches: relevantMatches,
      resumeText: text,
      meta: {
        warming,
        lastSyncAt: readSyncState()?.lastSyncAt ?? null,
        corpusSize: await countJobsCached(),
      },
    });
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
