import { GoogleGenAI } from "@google/genai";

export class MissingApiKeyError extends Error {}

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!client) {
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return client;
}

const SYSTEM_PROMPT = `You are an experienced resume coach. You'll be given a candidate's resume text and the role they are targeting. Give clear, specific, actionable feedback on how to improve their resume for that role.

Focus on:
- Skills or keywords relevant to the target role that are missing or underrepresented
- Weak or vague bullet points that could be rewritten to show measurable impact
- Structural or clarity issues
- Anything that stands out as a gap for this specific role

Respond with a short list of concrete, specific suggestions (no more than 6). Do not restate the resume back to the candidate. Be direct and practical, not generic.`;

/**
 * Uses Gemini to compare a resume against a target role and return
 * actionable improvement suggestions.
 */
export async function generateResumeSuggestions(resumeText: string, targetRole: string): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    throw new MissingApiKeyError("GEMINI_API_KEY is not set.");
  }

  const response = await getClient().models.generateContent({
    model: "gemini-flash-latest",
    contents: `Target role: ${targetRole}\n\nResume:\n${resumeText}`,
    config: {
      systemInstruction: SYSTEM_PROMPT,
    },
  });

  return response.text?.trim() ?? "";
}
