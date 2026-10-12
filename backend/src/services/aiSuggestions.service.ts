import { llm } from "./llm/index.js";

export { MissingApiKeyError } from "./llm/types.js";

/** Env var the active provider reads its key from, for setup-hint messages. */
export const LLM_KEY_ENV_VAR = llm.apiKeyEnvVar;

// The API accepts resumes up to MAX_RESUME_LENGTH, but Groq's free tier allows
// only ~6000 tokens/minute — a full 20k-character resume would consume a whole
// minute's budget on its own. Coaching feedback doesn't need the tail end.
const MAX_PROMPT_CHARS = 8000;

const SYSTEM_PROMPT = `You are an experienced resume coach. You'll be given a candidate's resume text and the role they are targeting. Give clear, specific, actionable feedback on how to improve their resume for that role.

Focus on:
- Skills or keywords relevant to the target role that are missing or underrepresented
- Weak or vague bullet points that could be rewritten to show measurable impact
- Structural or clarity issues
- Anything that stands out as a gap for this specific role

Respond with a short list of concrete, specific suggestions (no more than 6). Do not restate the resume back to the candidate. Be direct and practical, not generic.`;

/**
 * Compares a resume against a target role via the configured LLM provider and
 * returns actionable improvement suggestions.
 */
export async function generateResumeSuggestions(resumeText: string, targetRole: string): Promise<string> {
  const resume = resumeText.slice(0, MAX_PROMPT_CHARS);
  return llm.complete(SYSTEM_PROMPT, `Target role: ${targetRole}\n\nResume:\n${resume}`);
}
