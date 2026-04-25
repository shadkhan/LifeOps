import "server-only";

import type { z } from "zod";
import { createJsonMessages, parseJsonWithSchema } from "./json";
import type { AIProvider, GenerateJSONOptions, GenerateJSONResult, GenerateTextOptions } from "./types";

type OllamaResponse = {
  message?: {
    content?: string;
  };
  error?: string;
};

export function createOllamaProvider(): AIProvider {
  return {
    name: "ollama",
    generateText: postOllama,
    generateJSON: generateOllamaJSON,
  };
}

async function postOllama(options: GenerateTextOptions): Promise<string> {
  const baseUrl = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OLLAMA_MODEL ?? "llama3.1",
      messages: options.messages,
      stream: false,
      options: {
        temperature: options.temperature ?? 0.2,
        num_predict: options.maxTokens,
      },
    }),
  });

  const json = (await response.json()) as OllamaResponse;
  if (!response.ok) {
    throw new Error(json.error ?? `Ollama request failed with status ${response.status}`);
  }

  const content = json.message?.content;
  if (!content) {
    throw new Error("Ollama returned an empty response.");
  }

  return content;
}

async function generateOllamaJSON<TSchema extends z.ZodType>(
  options: GenerateJSONOptions<TSchema>,
): Promise<GenerateJSONResult<TSchema>> {
  const maxAttempts = (options.retries ?? 2) + 1;
  let previousInvalidOutput: string | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const raw = await postOllama(createJsonMessages(options, previousInvalidOutput));

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
