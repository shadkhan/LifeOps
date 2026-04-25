import type { AIProvider } from "@lifeops/db";
import type { AIClient } from "@/lib/ai/types";
import { createAnthropicClient } from "./anthropic";
import { createGroqClient } from "./groq";
import { createOpenAIClient } from "./openai";

export function createAIClient(provider: AIProvider): AIClient {
  if (provider === "openai") {
    return createOpenAIClient(requireEnv("OPENAI_API_KEY"));
  }

  if (provider === "anthropic") {
    return createAnthropicClient(requireEnv("ANTHROPIC_API_KEY"));
  }

  return createGroqClient(requireEnv("GROQ_API_KEY"));
}

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required for the selected AI provider.`);
  }

  return value;
}
