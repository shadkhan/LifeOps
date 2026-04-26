import "server-only";

import type { z } from "zod";

export type JsonRepairResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: string;
      raw: string;
    };

export function parseJsonSafely<TSchema extends z.ZodType>(
  raw: string,
  schema: TSchema,
): JsonRepairResult<z.infer<TSchema>> {
  const repaired = repairJsonText(raw);

  try {
    const parsed = JSON.parse(repaired) as unknown;
    const result = schema.safeParse(parsed);

    if (!result.success) {
      return {
        ok: false,
        error: result.error.issues[0]?.message ?? "AI response did not match the expected schema.",
        raw,
      };
    }

    return {
      ok: true,
      data: result.data,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "AI response was not valid JSON.",
      raw,
    };
  }
}

export function repairJsonText(raw: string) {
  const extracted = extractJson(raw)
    .replace(/^\uFEFF/, "")
    .replace(/,\s*([}\]])/g, "$1")
    .trim();

  return extracted;
}

function extractJson(raw: string) {
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
