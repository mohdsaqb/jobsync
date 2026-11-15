import Groq, { APIError } from "groq-sdk";
import { ApiError, GoogleGenAI } from "@google/genai";
import { env } from "../config/env.js";

export const LLM_KEY_ENV_VAR = env.llmProvider === "gemini" ? "GEMINI_API_KEY" : "GROQ_API_KEY";

export class MissingApiKeyError extends Error {}

export class LlmApiError extends Error {
  constructor(readonly status: number | undefined, message: string) {
    super(message);
  }
}

let groq: Groq | undefined;
let gemini: GoogleGenAI | undefined;

const SYSTEM_PROMPT = `You are an experienced resume coach. You'll be given a candidate's resume text and the role they are targeting. Give clear, specific, actionable feedback on how to improve their resume for that role.

Focus on:
- Skills or keywords relevant to the target role that are missing or underrepresented
- Weak or vague bullet points that could be rewritten to show measurable impact
- Structural or clarity issues
- Anything that stands out as a gap for this specific role

Respond with a short list of concrete, specific suggestions (no more than 6). Do not restate the resume back to the candidate. Be direct and practical, not generic.`;

export async function generateResumeSuggestions(resumeText: string, targetRole: string): Promise<string> {
  const apiKey = process.env[LLM_KEY_ENV_VAR];
  if (!apiKey) throw new MissingApiKeyError(`${LLM_KEY_ENV_VAR} is not set.`);
  const prompt = `Target role: ${targetRole}\n\nResume:\n${resumeText.slice(0, 8000)}`;

  try {
    if (env.llmProvider === "gemini") {
      gemini ??= new GoogleGenAI({ apiKey });
      const response = await gemini.models.generateContent({
        model: "gemini-flash-latest",
        contents: prompt,
        config: { systemInstruction: SYSTEM_PROMPT },
      });
      return response.text?.trim() ?? "";
    }

    groq ??= new Groq({ apiKey });
    const response = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      max_completion_tokens: 900,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
    });
    return response.choices[0]?.message?.content?.trim() ?? "";
  } catch (error) {
    if (error instanceof APIError || error instanceof ApiError) {
      throw new LlmApiError(error.status, error.message);
    }
    throw error;
  }
}
