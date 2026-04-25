import "server-only";

import type { z } from "zod";
import type { AIProvider, GenerateJSONOptions, GenerateJSONResult } from "./types";

export function createFallbackProvider(): AIProvider {
  return {
    name: "fallback",
    async generateText() {
      return "AI is temporarily unavailable. Review your current priorities, choose one focused next action, and keep the plan simple.";
    },
    async generateJSON<TSchema extends z.ZodType>(
      options: GenerateJSONOptions<TSchema>,
    ): Promise<GenerateJSONResult<TSchema>> {
      return createFallbackJSON(options.schema);
    },
  };
}

export function createFallbackJSON<TSchema extends z.ZodType>(schema: TSchema): z.infer<TSchema> {
  const candidates: unknown[] = [
    {
      habits: [
        {
          name: "Review goal progress",
          frequency: "daily",
          suggestedReminderTime: "09:00",
          reason: "A short daily review keeps the goal visible and helps identify the next useful step.",
        },
        {
          name: "Complete one small goal action",
          frequency: "weekdays",
          suggestedReminderTime: "10:00",
          reason: "Small consistent actions are easier to approve, schedule, and sustain.",
        },
      ],
    },
    {
      date: new Date().toISOString().slice(0, 10),
      priorities: ["Choose one important task", "Complete today's habits", "Capture any useful notes"],
      plan: [
        {
          title: "Daily planning",
          startTime: "09:00",
          endTime: "09:15",
          focus: "Review active goals, due tasks, and habits before committing to the day.",
        },
        {
          title: "Focused execution",
          startTime: "10:00",
          endTime: "11:00",
          focus: "Work on the single task that best supports the current goal.",
        },
      ],
      suggestedTasks: [
        {
          title: "Pick the next visible action",
          reason: "The fallback planner avoids guessing and keeps the user in control.",
        },
      ],
      reflectionPrompt: "What action today most supported the future self you are building?",
    },
    {
      summary:
        "AI review is temporarily unavailable, so this fallback review focuses on simple reflection from the user's saved activity.",
      wins: ["Identify completed tasks and habits from this week."],
      gaps: ["Notice any goals or habits that did not receive attention."],
      habitInsights: ["Look for the habit with the most consistent completion."],
      goalProgress: ["Compare this week's completed work against active goals."],
      nextWeekSuggestions: ["Choose one goal to prioritize and schedule the first small action."],
    },
    {
      summary: "AI note summary is temporarily unavailable. Review the note and capture the key takeaway manually.",
      keyPoints: ["Mark the most important idea from the note."],
      possibleNextActions: ["Turn one useful idea into a small task if it supports an active goal."],
    },
    {
      actions: [
        {
          title: "Define the next small step",
          reason: "A concrete next action keeps goal progress moving without relying on AI availability.",
          effort: "low",
        },
      ],
    },
  ];

  for (const candidate of candidates) {
    const result = schema.safeParse(candidate);
    if (result.success) {
      return result.data;
    }
  }

  throw new Error("No fallback response is registered for this AI JSON schema.");
}
