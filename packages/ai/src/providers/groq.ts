import "server-only";

import { generateJSONWithRetries, postOpenAICompatible } from "./openai";
import type { AIProvider } from "./types";

export function createGroqProvider(): AIProvider {
  return {
    name: "groq",
    generateText: (options) =>
      postOpenAICompatible({
        apiKey: requireEnv("GROQ_API_KEY"),
        baseUrl: "https://api.groq.com/openai/v1",
        model: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
        options,
      }),
    generateJSON: (options) =>
      generateJSONWithRetries(options, (textOptions) =>
        postOpenAICompatible({
          apiKey: requireEnv("GROQ_API_KEY"),
          baseUrl: "https://api.groq.com/openai/v1",
          model: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
          options: textOptions,
        }),
      ),
  };
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required for the selected AI provider.`);
  }

  return value;
}
