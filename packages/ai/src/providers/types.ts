import type { z } from "zod";

export type AIMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type GenerateTextOptions = {
  messages: AIMessage[];
  temperature?: number;
  maxTokens?: number;
};

export type GenerateJSONOptions<TSchema extends z.ZodType> = GenerateTextOptions & {
  schema: TSchema;
  retries?: number;
};

export type GenerateJSONResult<TSchema extends z.ZodType> = z.infer<TSchema>;

export interface AIProvider {
  name: string;
  generateText(options: GenerateTextOptions): Promise<string>;
  generateJSON<TSchema extends z.ZodType>(
    options: GenerateJSONOptions<TSchema>,
  ): Promise<GenerateJSONResult<TSchema>>;
}
