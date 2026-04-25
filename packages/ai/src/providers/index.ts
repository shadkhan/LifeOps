import "server-only";

import { createFallbackProvider } from "./fallback";
import { createGroqProvider } from "./groq";
import { createOllamaProvider } from "./ollama";
import { createOpenAIProvider } from "./openai";
import { createResilientProvider } from "./resilient";
import { createTogetherProvider } from "./together";
import type { AIProvider } from "./types";

export type { AIMessage, AIProvider, GenerateJSONOptions, GenerateTextOptions } from "./types";

export function getAIProvider(): AIProvider {
  const provider = (process.env.AI_PROVIDER ?? "openai").toLowerCase();

  switch (provider) {
    case "groq":
      return createResilientProvider(createGroqProvider());
    case "openai":
      return createResilientProvider(createOpenAIProvider());
    case "together":
    case "togetherai":
    case "together-ai":
      return createResilientProvider(createTogetherProvider());
    case "ollama":
      return createResilientProvider(createOllamaProvider());
    case "fallback":
    case "offline":
      return createFallbackProvider();
    default:
      if (process.env.AI_FALLBACK_ENABLED !== "false") {
        return createFallbackProvider();
      }

      throw new Error(`Unsupported AI_PROVIDER "${provider}".`);
  }
}
