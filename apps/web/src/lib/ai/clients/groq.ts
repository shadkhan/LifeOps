import type { z } from "zod";
import type { AIClient, GenerateJsonInput } from "@/lib/ai/types";
import { generateWithRetry, getRequestError } from "./json";

type GroqChatResponse = {
  choices?: Array<{ message?: { content?: string } }>;
};

export function createGroqClient(apiKey: string): AIClient {
  return {
    provider: "groq",
    generateJson: <TSchema extends z.ZodType>(input: GenerateJsonInput<TSchema>) =>
      generateWithRetry(input, async (messages) => {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: input.model,
            messages: [
              ...messages,
              {
                role: "user",
                content: `JSON schema name: ${input.output.name}. Schema: ${JSON.stringify(input.output.schema)}`,
              },
            ],
            temperature: input.temperature ?? 0.2,
            max_tokens: input.maxTokens ?? 1200,
            response_format: { type: "json_object" },
          }),
        });

        const body = (await response.json()) as GroqChatResponse;
        if (!response.ok) {
          throw new Error(getRequestError("Groq", response.status, body));
        }

        const content = body.choices?.[0]?.message?.content;
        if (!content) {
          throw new Error("Groq returned an empty response.");
        }

        return content;
      }),
  };
}
