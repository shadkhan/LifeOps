import "server-only";

import { buildAIPrompt, type JsonObject } from "../prompt-builder";

export type FutureSelfPromptInput = {
  prompt: string;
  existingFutureSelf?: string | null;
};

const futureSelfOutputShape: JsonObject = {
  title: "Short future self title",
  description: "Concise profile description",
  identityStatement: "First-person identity statement",
  lifeAreas: [
    {
      name: "Health",
      type: "health",
      vision: "Desired future state",
      currentReality: "Optional current reality",
      gap: "Optional gap to close",
    },
  ],
};

export function buildFutureSelfPrompt(input: FutureSelfPromptInput) {
  return buildAIPrompt({
    workflow: "Future Self Profile generation",
    task: "Create a Future Self profile and 3-6 life areas from the user's plain-language prompt.",
    context: input,
    outputShape: futureSelfOutputShape,
    extraRules: [
      "Life area type must be one of: health, career, relationships, finance, learning, creativity, spirituality, home, other.",
      "Keep the identity statement grounded and believable.",
    ],
  });
}
