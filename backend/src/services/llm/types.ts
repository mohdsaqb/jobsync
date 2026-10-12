/** Thrown when the active provider has no API key configured. */
export class MissingApiKeyError extends Error {}

/**
 * Provider-neutral wrapper around an LLM API failure, so the controller can
 * map status codes without knowing which SDK threw.
 */
export class LlmApiError extends Error {
  constructor(
    readonly status: number | undefined,
    message: string,
  ) {
    super(message);
  }
}

export interface LlmProvider {
  /** Provider id, as accepted by LLM_PROVIDER. */
  readonly name: string;
  /** Env var holding this provider's key — used in user-facing setup messages. */
  readonly apiKeyEnvVar: string;
  complete(systemPrompt: string, userPrompt: string): Promise<string>;
}
