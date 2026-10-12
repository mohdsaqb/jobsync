import Groq, { APIError } from "groq-sdk";
import { LlmApiError, MissingApiKeyError, type LlmProvider } from "./types.js";

// gpt-oss-120b runs at ~500 tok/s on Groq, so a suggestion list comes back in
// well under a second while still being a 120B-parameter model.
const MODEL = "openai/gpt-oss-120b";

// The free tier allows ~6000 tokens/minute across input and output, so the
// response is bounded to leave room for the next request.
const MAX_COMPLETION_TOKENS = 900;

let client: Groq | null = null;

function getClient(): Groq {
  if (!client) {
    client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return client;
}

export const groqProvider: LlmProvider = {
  name: "groq",
  apiKeyEnvVar: "GROQ_API_KEY",

  async complete(systemPrompt, userPrompt) {
    if (!process.env.GROQ_API_KEY) {
      throw new MissingApiKeyError("GROQ_API_KEY is not set.");
    }

    try {
      const response = await getClient().chat.completions.create({
        model: MODEL,
        max_completion_tokens: MAX_COMPLETION_TOKENS,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });

      return response.choices[0]?.message?.content?.trim() ?? "";
    } catch (err) {
      if (err instanceof APIError) {
        throw new LlmApiError(err.status, err.message);
      }
      throw err;
    }
  },
};
