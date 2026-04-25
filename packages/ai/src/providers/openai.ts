import "server-only";

import type { z } from "zod";
import { createJsonMessages, parseJsonWithSchema } from "./json";
import type { AIProvider, GenerateJSONOptions, GenerateJSONResult, GenerateTextOptions } from "./types";

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

export function createOpenAIProvider(): AIProvider {
  return {
    name: "openai",
    generateText: (options) =>
      postOpenAICompatible({
        apiKey: requireEnv("OPENAI_API_KEY"),
        baseUrl: "https://api.openai.com/v1",
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        options,
      }),
    generateJSON: (options) =>
      generateJSONWithRetries(options, (textOptions) =>
        postOpenAICompatible({
          apiKey: requireEnv("OPENAI_API_KEY"),
          baseUrl: "https://api.openai.com/v1",
          model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
          options: textOptions,
        }),
      ),
  };
}

export async function postOpenAICompatible(input: {
  apiKey: string;
  baseUrl: string;
  model: string;
  options: GenerateTextOptions;
}): Promise<string> {
  const response = await fetch(`${input.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: input.model,
      messages: input.options.messages,
      temperature: input.options.temperature ?? 0.2,
      max_tokens: input.options.maxTokens,
    }),
  });

  const json = (await response.json()) as ChatCompletionResponse;

  if (!response.ok) {
    throw new Error(json.error?.message ?? `AI request failed with status ${response.status}`);
  }

  const content = json.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("AI provider returned an empty response.");
  }

  return content;
}

export async function generateJSONWithRetries<TSchema extends z.ZodType>(
  options: GenerateJSONOptions<TSchema>,
  generateText: (options: GenerateTextOptions) => Promise<string>,
): Promise<GenerateJSONResult<TSchema>> {
  const maxAttempts = (options.retries ?? 2) + 1;
  let previousInvalidOutput: string | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const raw = await generateText(createJsonMessages(options, previousInvalidOutput));

    try {
      return parseJsonWithSchema(raw, options.schema);
    } catch (error) {
      previousInvalidOutput = raw;
      if (attempt === maxAttempts) {
        throw error;
      }
    }
  }

  throw new Error("Unable to generate valid JSON.");
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required for the selected AI provider.`);
  }

  return value;
}
