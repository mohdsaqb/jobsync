import { ApiError, GoogleGenAI } from "@google/genai";
import { LlmApiError, MissingApiKeyError, type LlmProvider } from "./types.js";

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!client) {
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return client;
}

/** Kept as a working alternative so LLM_PROVIDER can be flipped if Groq's free tier changes. */
export const geminiProvider: LlmProvider = {
  name: "gemini",
  apiKeyEnvVar: "GEMINI_API_KEY",

  async complete(systemPrompt, userPrompt) {
    if (!process.env.GEMINI_API_KEY) {
      throw new MissingApiKeyError("GEMINI_API_KEY is not set.");
    }

    try {
      const response = await getClient().models.generateContent({
        model: "gemini-flash-latest",
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
        },
      });

      return response.text?.trim() ?? "";
    } catch (err) {
      if (err instanceof ApiError) {
        throw new LlmApiError(err.status, err.message);
      }
      throw err;
    }
  },
};
