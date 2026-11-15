import assert from "node:assert/strict";
import { test } from "node:test";
import type { Request, Response } from "express";
import { env } from "../src/config/env.js";
import { suggestResumeImprovements } from "../src/controllers/suggestions.controller.js";
import { getResumeSuggestions } from "../../frontend/lib/api.ts";

test("AI suggestions preserve both provider settings, prompts and errors", async () => {
  const originalFetch = globalThis.fetch;
  const originalProvider = env.llmProvider;
  const originalKeys = { GROQ_API_KEY: process.env.GROQ_API_KEY, GEMINI_API_KEY: process.env.GEMINI_API_KEY };

  try {
    for (const provider of ["groq", "gemini"]) {
      env.llmProvider = provider;
      const key = provider === "gemini" ? "GEMINI_API_KEY" : "GROQ_API_KEY";
      process.env[key] = "test-key";
      const service = await import(`../src/services/aiSuggestions.service.ts?provider=${provider}`);
      let requestBody: Record<string, unknown> = {};
      let requestUrl = "";
      let rejectRequest = false;
      const text = "**1. Show impact**\nAdd measurable outcomes.";

      globalThis.fetch = async (input, options) => {
        const request = new Request(input, options);
        requestUrl = request.url;
        requestBody = JSON.parse(await request.text());
        if (rejectRequest) {
          return Response.json({ error: { code: 403, status: "PERMISSION_DENIED", message: "Rejected key" } }, { status: 403 });
        }
        return Response.json(provider === "groq"
          ? { choices: [{ message: { content: ` ${text} ` } }] }
          : { candidates: [{ content: { parts: [{ text: ` ${text} ` }] } }] });
      };

      assert.equal(service.LLM_KEY_ENV_VAR, key);
      assert.equal(await service.generateResumeSuggestions("x".repeat(9000), "Data Engineer"), text);
      const payload = JSON.stringify(requestBody);
      assert.match(payload, /Data Engineer/);
      assert.ok(payload.includes("x".repeat(8000)));
      assert.ok(!payload.includes("x".repeat(8001)));
      if (provider === "groq") {
        assert.equal(requestBody.model, "openai/gpt-oss-120b");
        assert.equal(requestBody.max_completion_tokens, 900);
      } else {
        assert.match(requestUrl, /gemini-flash-latest/);
      }

      rejectRequest = true;
      await assert.rejects(service.generateResumeSuggestions("Resume", "Data Engineer"), (error: unknown) =>
        error instanceof service.LlmApiError && error.status === 403);
      delete process.env[key];
      await assert.rejects(service.generateResumeSuggestions("Resume", "Data Engineer"), service.MissingApiKeyError);
    }
  } finally {
    globalThis.fetch = originalFetch;
    env.llmProvider = originalProvider;
    for (const [key, value] of Object.entries(originalKeys)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test("suggestion endpoint rejects empty and oversized fields before calling AI", async () => {
  for (const body of [
    {},
    { resumeText: " ", targetRole: "Developer" },
    { resumeText: "Resume", targetRole: " " },
    { resumeText: "x".repeat(20001), targetRole: "Developer" },
    { resumeText: "Resume", targetRole: "x".repeat(201) },
  ]) {
    let status = 200;
    let result: { error?: string } = {};
    const response = {
      status(code: number) { status = code; return this; },
      json(value: typeof result) { result = value; return this; },
    } as Response;
    await suggestResumeImprovements({ body } as Request, response);
    assert.equal(status, 400);
    assert.ok(result.error);
  }
});

test("suggestion client sends the manually entered role and handles API failures", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (url, options) => {
      assert.equal(url, "/api/resume/suggest");
      assert.equal(options?.method, "POST");
      assert.deepEqual(JSON.parse(options?.body as string), { resumeText: "My resume", targetRole: "Data Engineer" });
      return Response.json({ suggestions: "Add relevant SQL projects." });
    };
    assert.equal(await getResumeSuggestions("My resume", "Data Engineer"), "Add relevant SQL projects.");
    globalThis.fetch = async () => Response.json({ error: "Please try again." }, { status: 502 });
    await assert.rejects(getResumeSuggestions("My resume", "Data Engineer"), /Please try again/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
