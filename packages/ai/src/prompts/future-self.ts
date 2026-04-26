import "server-only";

import { buildAIPrompt, type JsonObject } from "../prompt-builder";

export type FutureSelfPromptInput = {
  prompt: string;
  existingFutureSelf?: string | null;
};

const futureSelfOutputShape: JsonObject = {
  title: "Short future self title",
  description: "2-4 sentence profile summary covering future lifestyle, priorities, behaviors, and outcomes",
  identityStatement: 'One short first-person present-tense identity anchor starting with "I am..."',
  lifeAreas: [
    {
      name: "Health",
      type: "health",
      vision: "Desired future state",
      currentReality: "Optional current reality",
      gap: "Optional gap to close",
    },
  ],
  suggestedGoals: [
    {
      title: "Specific goal title",
      description: "Outcome this goal creates",
      lifeAreaName: "Matching life area name",
      priority: "medium",
      targetDate: "Optional ISO date",
      reason: "Why this supports the profile",
    },
  ],
  suggestedHabits: [
    {
      name: "Small repeatable habit",
      description: "Optional habit detail",
      frequency: "daily",
      suggestedReminderTime: "Optional HH:mm",
      reason: "Why this habit helps",
      lifeAreaName: "Optional matching life area name",
      goalTitle: "Optional matching suggested goal title",
    },
  ],
};

export function buildFutureSelfPrompt(input: FutureSelfPromptInput) {
  return buildAIPrompt({
    workflow: "Future Self Profile generation",
    task: "Create a Future Self profile, 3-6 life areas, 3-6 suggested goals, and 3-6 suggested habits from the user's plain-language prompt.",
    context: input,
    outputShape: futureSelfOutputShape,
    extraRules: [
      "Life area type must be one of: health, career, relationships, finance, learning, creativity, spirituality, home, other.",
      "Make description and identityStatement clearly different.",
      "description must be a profile summary, not an affirmation.",
      'identityStatement must be one short first-person present-tense self-belief starting with "I am...", not a profile summary.',
      "Suggested goals must reference one of the generated life area names.",
      "Suggested habits should reference a generated goalTitle when there is a clear match.",
      "Keep the identity statement grounded and believable.",
    ],
  });
}
