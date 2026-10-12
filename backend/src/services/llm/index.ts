import { env } from "../../config/env.js";
import { geminiProvider } from "./gemini.provider.js";
import { groqProvider } from "./groq.provider.js";
import type { LlmProvider } from "./types.js";

const PROVIDERS: Record<string, LlmProvider> = {
  [groqProvider.name]: groqProvider,
  [geminiProvider.name]: geminiProvider,
};

export const llm: LlmProvider = PROVIDERS[env.llmProvider] ?? groqProvider;

export { LlmApiError, MissingApiKeyError, type LlmProvider } from "./types.js";
