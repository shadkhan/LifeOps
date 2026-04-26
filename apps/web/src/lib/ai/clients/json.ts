import type { z } from "zod";
import type { AIMessage, AIUsage, GenerateJsonInput, GenerateJsonResult } from "@/lib/ai/types";

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
  generate: (messages: AIMessage[]) => Promise<{ content: string; usage?: AIUsage }>,
): Promise<GenerateJsonResult<TSchema>> {
  const firstMessages = withJsonInstruction(input.messages, input.output.name);
  let firstUsage: AIUsage | undefined;

  try {
    const response = await generate(firstMessages);
    return {
      data: parseJsonWithSchema(response.content, input.schema),
      usage: response.usage,
    };
  } catch (error) {
    const retryMessages: AIMessage[] = [
      ...firstMessages,
      {
        role: "user",
        content: "The previous response was invalid. Return only corrected JSON matching the requested schema.",
      },
    ];
    if (error instanceof Error && "usage" in error) {
      firstUsage = (error as { usage?: AIUsage }).usage;
    }
    const response = await generate(retryMessages);
    return {
      data: parseJsonWithSchema(response.content, input.schema),
      usage: combineUsage(firstUsage, response.usage),
    };
  }
}

function combineUsage(first?: AIUsage, second?: AIUsage): AIUsage | undefined {
  if (!first) {
    return second;
  }

  if (!second) {
    return first;
  }

  return {
    inputTokens: addOptional(first.inputTokens, second.inputTokens),
    outputTokens: addOptional(first.outputTokens, second.outputTokens),
    totalTokens: addOptional(first.totalTokens, second.totalTokens),
  };
}

function addOptional(first?: number, second?: number) {
  if (first === undefined && second === undefined) {
    return undefined;
  }

  return (first ?? 0) + (second ?? 0);
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
