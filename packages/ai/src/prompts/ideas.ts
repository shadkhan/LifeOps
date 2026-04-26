import "server-only";

import { buildAIPrompt, type JsonObject } from "../prompt-builder";

export type IdeaExpansionPromptInput = {
  idea: string;
  futureSelf?: string | null;
  activeGoals?: Array<{ title: string; lifeArea?: string; progress?: number }>;
};

const ideaExpansionOutputShape: JsonObject = {
  title: "Short idea title",
  summary: "Practical explanation of the idea",
  whyItMatters: "Why it may be useful",
  nextSteps: [{ title: "Next step", priority: "medium", sourceType: "idea", reason: "Why this step helps" }],
  relatedHabits: [{ name: "Supporting habit", frequency: "weekly", reason: "Why this habit helps" }],
  questions: ["Clarifying question"],
};

export function buildIdeaExpansionPrompt(idea: IdeaExpansionPromptInput) {
  return buildAIPrompt({
    workflow: "Idea Expansion",
    task: "Expand the idea into a practical planning note with next steps, habits, and clarifying questions.",
    context: idea,
    outputShape: ideaExpansionOutputShape,
    extraRules: [
      "Keep the expansion grounded in what can be saved as a note or selected as tasks.",
      "Do not turn a vague idea into a large project plan unless the context supports it.",
    ],
  });
}
