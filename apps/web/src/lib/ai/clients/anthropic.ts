import type { z } from "zod";
import type { AIClient, GenerateJsonInput } from "@/lib/ai/types";
import { generateWithRetry, getRequestError } from "./json";

type AnthropicResponse = {
  content?: Array<
    | { type: "text"; text: string }
    | { type: "tool_use"; name: string; input: unknown }
  >;
};

export function createAnthropicClient(apiKey: string): AIClient {
  return {
    provider: "anthropic",
    generateJson: <TSchema extends z.ZodType>(input: GenerateJsonInput<TSchema>) =>
      generateWithRetry(input, async (messages) => {
        const system = messages
          .filter((message) => message.role === "system")
          .map((message) => message.content)
          .join("\n");
        const anthropicMessages = messages
          .filter((message) => message.role !== "system")
          .map((message) => ({
            role: message.role === "assistant" ? "assistant" : "user",
            content: message.content,
          }));

        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: input.model,
            system,
            messages: anthropicMessages,
            temperature: input.temperature ?? 0.2,
            max_tokens: input.maxTokens ?? 1200,
            tools: [
              {
                name: input.output.name,
                description: "Return the requested LifeOps JSON response.",
                input_schema: input.output.schema,
              },
            ],
            tool_choice: { type: "tool", name: input.output.name },
          }),
        });

        const body = (await response.json()) as AnthropicResponse;
        if (!response.ok) {
          throw new Error(getRequestError("Anthropic", response.status, body));
        }

        const toolUse = body.content?.find(
          (item): item is { type: "tool_use"; name: string; input: unknown } =>
            item.type === "tool_use" && item.name === input.output.name,
        );

        if (toolUse) {
          return JSON.stringify(toolUse.input);
        }

        const text = body.content?.find((item): item is { type: "text"; text: string } => item.type === "text")?.text;
        if (!text) {
          throw new Error("Anthropic returned an empty response.");
        }

        return text;
      }),
  };
}
