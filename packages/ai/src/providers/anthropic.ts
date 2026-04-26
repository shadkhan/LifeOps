import "server-only";

import { generateJSONWithRetries } from "./openai";
import type { AIProvider, GenerateTextOptions } from "./types";

type AnthropicResponse = {
  content?: Array<{ type: "text"; text: string }>;
  error?: {
    message?: string;
  };
};

export function createAnthropicProvider(): AIProvider {
  return {
    name: "anthropic",
    generateText: (options) =>
      postAnthropic({
        apiKey: requireEnv("ANTHROPIC_API_KEY"),
        model: process.env.ANTHROPIC_MODEL ?? "claude-3-5-haiku-latest",
        options,
      }),
    generateJSON: (options) =>
      generateJSONWithRetries(options, (textOptions) =>
        postAnthropic({
          apiKey: requireEnv("ANTHROPIC_API_KEY"),
          model: process.env.ANTHROPIC_MODEL ?? "claude-3-5-haiku-latest",
          options: textOptions,
        }),
      ),
  };
}

async function postAnthropic(input: {
  apiKey: string;
  model: string;
  options: GenerateTextOptions;
}) {
  const system = input.options.messages
    .filter((message) => message.role === "system")
    .map((message) => message.content)
    .join("\n");
  const messages = input.options.messages
    .filter((message) => message.role !== "system")
    .map((message) => ({
      role: message.role === "assistant" ? "assistant" : "user",
      content: message.content,
    }));

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": input.apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: input.model,
      system,
      messages,
      temperature: input.options.temperature ?? 0.2,
      max_tokens: input.options.maxTokens ?? 1600,
    }),
  });

  const body = (await response.json()) as AnthropicResponse;

  if (!response.ok) {
    throw new Error(body.error?.message ?? `Anthropic request failed with status ${response.status}`);
  }

  const text = body.content?.find((item) => item.type === "text")?.text;
  if (!text) {
    throw new Error("Anthropic returned an empty response.");
  }

  return text;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required for the selected AI provider.`);
  }

  return value;
}
