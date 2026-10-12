import type { Request, Response } from "express";
import { generateResumeSuggestions, LLM_KEY_ENV_VAR, MissingApiKeyError } from "../services/aiSuggestions.service.js";
import { LlmApiError } from "../services/llm/index.js";

const MAX_RESUME_LENGTH = 20000;
const MAX_ROLE_LENGTH = 200;

export async function suggestResumeImprovements(req: Request, res: Response): Promise<void> {
  const { resumeText, targetRole } = req.body ?? {};

  if (typeof resumeText !== "string" || resumeText.trim().length === 0) {
    res.status(400).json({ error: "resumeText is required." });
    return;
  }
  if (typeof targetRole !== "string" || targetRole.trim().length === 0) {
    res.status(400).json({ error: "targetRole is required." });
    return;
  }
  if (resumeText.length > MAX_RESUME_LENGTH) {
    res.status(400).json({ error: "Resume text is too long." });
    return;
  }
  if (targetRole.length > MAX_ROLE_LENGTH) {
    res.status(400).json({ error: "Target role is too long." });
    return;
  }

  try {
    const suggestions = await generateResumeSuggestions(resumeText.trim(), targetRole.trim());
    res.json({ suggestions });
  } catch (err) {
    if (err instanceof MissingApiKeyError) {
      res.status(503).json({
        error: `AI suggestions aren't configured yet — add a ${LLM_KEY_ENV_VAR} to backend/.env and restart the server.`,
      });
      return;
    }
    if (err instanceof LlmApiError) {
      console.error("LLM API error:", err);
      if (err.status === 401 || err.status === 403) {
        res
          .status(502)
          .json({ error: `The configured ${LLM_KEY_ENV_VAR} was rejected. Double-check it in backend/.env.` });
        return;
      }
      if (err.status === 429) {
        res.status(502).json({ error: "The AI provider's rate limit was reached. Please wait a moment and try again." });
        return;
      }
      // Not necessarily transient — surface the provider's own message rather than a generic one.
      res.status(502).json({ error: `AI suggestions are unavailable: ${err.message}` });
      return;
    }

    console.error("Resume suggestion failed:", err);
    res.status(500).json({ error: "Something went wrong while generating suggestions." });
  }
}
