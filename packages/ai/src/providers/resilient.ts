import "server-only";

import type { z } from "zod";
import { createFallbackProvider } from "./fallback";
import type { AIProvider, GenerateJSONOptions, GenerateJSONResult, GenerateTextOptions } from "./types";

export function createResilientProvider(primary: AIProvider): AIProvider {
  const fallback = createFallbackProvider();

  return {
    name: primary.name,
    async generateText(options: GenerateTextOptions): Promise<string> {
      try {
        return await primary.generateText(options);
      } catch (error) {
        if (!isFallbackEnabled()) {
          throw error;
        }

        return fallback.generateText(options);
      }
    },
    async generateJSON<TSchema extends z.ZodType>(
      options: GenerateJSONOptions<TSchema>,
    ): Promise<GenerateJSONResult<TSchema>> {
      try {
        return await primary.generateJSON(options);
      } catch (error) {
        if (!isFallbackEnabled()) {
          throw error;
        }

        return fallback.generateJSON(options);
      }
    },
  };
}

function isFallbackEnabled(): boolean {
  return process.env.AI_FALLBACK_ENABLED !== "false";
}
