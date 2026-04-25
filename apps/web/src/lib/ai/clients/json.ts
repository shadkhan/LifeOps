import type { z } from "zod";
import type { AIMessage, GenerateJsonInput } from "@/lib/ai/types";

export function withJsonInstruction(messages: AIMessage[], outputName: string) {
  return [
    {
      role: "system" as const,
      content: `Return only valid JSON for the ${outputName} response. Do not include Markdown fences or commentary.`,
    },
    ...messages,
  ];
}

export function parseJsonWithSchema<TSchema extends z.ZodType>(raw: string, schema: TSchema): z.infer<TSchema> {
  return schema.parse(JSON.parse(extractJson(raw)));
}

export function getRequestError(provider: string, status: number, body: unknown) {
  const message =
    typeof body === "object" && body && "error" in body
      ? JSON.stringify((body as { error: unknown }).error)
      : JSON.stringify(body).slice(0, 500);

  return `${provider} request failed with status ${status}: ${message}`;
}

export async function generateWithRetry<TSchema extends z.ZodType>(
  input: GenerateJsonInput<TSchema>,
  generate: (messages: AIMessage[]) => Promise<string>,
) {
  const firstMessages = withJsonInstruction(input.messages, input.output.name);

  try {
    return parseJsonWithSchema(await generate(firstMessages), input.schema);
  } catch (error) {
    const retryMessages: AIMessage[] = [
      ...firstMessages,
      {
        role: "user",
        content: "The previous response was invalid. Return only corrected JSON matching the requested schema.",
      },
    ];
    return parseJsonWithSchema(await generate(retryMessages), input.schema);
  }
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

  throw new Error("AI response did not contain JSON.");
}
