import type { z } from "zod";
import type { AIClient, GenerateJsonInput } from "@/lib/ai/types";
import { generateWithRetry, getRequestError } from "./json";

type OpenAIChatResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
};

export function createOpenAIClient(apiKey: string): AIClient {
  return {
    provider: "openai",
    generateJson: <TSchema extends z.ZodType>(input: GenerateJsonInput<TSchema>) =>
      generateWithRetry(input, async (messages) => {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: input.model,
            messages,
            temperature: input.temperature ?? 0.2,
            max_tokens: input.maxTokens ?? 1200,
            response_format: {
              type: "json_schema",
              json_schema: {
                name: input.output.name,
                strict: true,
                schema: input.output.schema,
              },
            },
          }),
        });

        const body = (await response.json()) as OpenAIChatResponse;
        if (!response.ok) {
          throw new Error(getRequestError("OpenAI", response.status, body));
        }

        const content = body.choices?.[0]?.message?.content;
        if (!content) {
          throw new Error("OpenAI returned an empty response.");
        }

        return {
          content,
          usage: {
            inputTokens: body.usage?.prompt_tokens,
            outputTokens: body.usage?.completion_tokens,
            totalTokens: body.usage?.total_tokens,
          },
        };
      }),
  };
}
