import "server-only";

import { generateJSONWithRetries, postOpenAICompatible } from "./openai";
import type { AIProvider } from "./types";

export function createTogetherProvider(): AIProvider {
  return {
    name: "together",
    generateText: (options) =>
      postOpenAICompatible({
        apiKey: requireEnv("TOGETHER_API_KEY"),
        baseUrl: "https://api.together.xyz/v1",
        model: process.env.TOGETHER_MODEL ?? "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
        options,
      }),
    generateJSON: (options) =>
      generateJSONWithRetries(options, (textOptions) =>
        postOpenAICompatible({
          apiKey: requireEnv("TOGETHER_API_KEY"),
          baseUrl: "https://api.together.xyz/v1",
          model: process.env.TOGETHER_MODEL ?? "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
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
