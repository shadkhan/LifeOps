import type { z } from "zod";
import type { GenerateTextOptions } from "./types";

export function createJsonMessages(
  options: GenerateTextOptions,
  previousInvalidOutput?: string,
): GenerateTextOptions {
  const retryInstruction = previousInvalidOutput
    ? [
        {
          role: "user" as const,
          content:
            "The previous response was invalid JSON or did not match the required schema. Return only corrected JSON. Invalid response: " +
            previousInvalidOutput.slice(0, 4000),
        },
      ]
    : [];

  return {
    ...options,
    messages: [
      {
        role: "system",
        content:
          "Return only valid JSON. Do not include Markdown fences, commentary, or explanations.",
      },
      ...options.messages,
      ...retryInstruction,
    ],
  };
}

export function parseJsonWithSchema<TSchema extends z.ZodType>(
  raw: string,
  schema: TSchema,
): z.infer<TSchema> {
  const parsed = JSON.parse(extractJson(raw)) as unknown;
  return schema.parse(parsed);
}

function extractJson(raw: string): string {
  const trimmed = raw.trim();

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return trimmed;
  }

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const firstObject = trimmed.indexOf("{");
  const lastObject = trimmed.lastIndexOf("}");
  if (firstObject >= 0 && lastObject > firstObject) {
    return trimmed.slice(firstObject, lastObject + 1);
  }

  const firstArray = trimmed.indexOf("[");
  const lastArray = trimmed.lastIndexOf("]");
  if (firstArray >= 0 && lastArray > firstArray) {
    return trimmed.slice(firstArray, lastArray + 1);
  }

  return trimmed;
}
