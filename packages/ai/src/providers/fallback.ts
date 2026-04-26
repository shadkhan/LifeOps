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
      title: "Future Self Draft",
      description: "A practical future self draft for manual review.",
      identityStatement: "I am becoming someone who turns clear intentions into steady daily action.",
      lifeAreas: [
        {
          name: "Health",
          type: "health",
          vision: "Have enough energy for focused work and personal life.",
        },
        {
          name: "Career",
          type: "career",
          vision: "Make consistent progress on meaningful work.",
        },
      ],
      suggestedGoals: [
        {
          title: "Build a steady weekly progress rhythm",
          description: "Create a simple routine for choosing, completing, and reviewing important work.",
          lifeAreaName: "Career",
          priority: "medium",
          reason: "A fallback goal keeps progress moving while AI is unavailable.",
        },
      ],
      suggestedHabits: [
        {
          name: "Weekly progress review",
          frequency: "weekly",
          reason: "A review keeps the goal current and measurable.",
          lifeAreaName: "Career",
          goalTitle: "Build a steady weekly progress rhythm",
        },
      ],
    },
    {
      goals: [
        {
          title: "Build a steady weekly progress rhythm",
          description: "Create a simple routine for choosing, completing, and reviewing important work.",
          lifeAreaName: "Career",
          priority: "medium",
          reason: "A fallback goal keeps progress moving while AI is unavailable.",
        },
      ],
    },
    {
      summary: "Start with one measurable milestone, one repeatable habit, and one concrete next task.",
      milestones: ["Clarify the first measurable outcome", "Complete one weekly action", "Review progress"],
      habits: [
        {
          name: "Weekly progress review",
          frequency: "weekly",
          reason: "A review keeps the goal current and measurable.",
        },
      ],
      tasks: [
        {
          title: "Define the next visible action",
          priority: "medium",
          sourceType: "goal",
          reason: "A clear next action is easier to save and complete.",
        },
      ],
      risks: ["The goal may stay vague without a review checkpoint."],
      successMetrics: ["One linked task completed this week."],
    },
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
      tasks: [
        {
          title: "Define the next small step",
          priority: "medium",
          sourceType: "idea",
          reason: "A concrete next task keeps the workflow useful while AI is unavailable.",
        },
      ],
    },
    {
      title: "Expanded idea draft",
      summary: "AI is unavailable, so use this as a manual idea expansion placeholder.",
      whyItMatters: "A short expansion helps decide whether the idea is worth saving or turning into tasks.",
      nextSteps: [
        {
          title: "Clarify the desired outcome",
          priority: "medium",
          sourceType: "idea",
          reason: "The next useful step is defining what success would look like.",
        },
      ],
      relatedHabits: [
        {
          name: "Weekly idea review",
          frequency: "weekly",
          reason: "Reviewing ideas regularly prevents clutter.",
        },
      ],
      questions: ["What would make this idea worth pursuing now?"],
    },
    {
      date: new Date().toISOString().slice(0, 10),
      dailyFocus: "Choose one important action and complete it.",
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
      habitsToComplete: ["Review goal progress"],
      suggestedTasks: [
        {
          title: "Pick the next visible action",
          reason: "The fallback planner avoids guessing and keeps the user in control.",
        },
      ],
      avoidList: ["Starting too many unrelated tasks at once"],
      improvementSuggestion: "Keep the day small and reviewable.",
      reflectionPrompt: "What action today most supported the future self you are building?",
    },
    {
      summary:
        "AI review is temporarily unavailable, so this fallback review focuses on simple reflection from the user's saved activity.",
      wins: ["Identify completed tasks and habits from this week."],
      gaps: ["Notice any goals or habits that did not receive attention."],
      habitInsights: ["Look for the habit with the most consistent completion."],
      goalProgress: ["Compare this week's completed work against active goals."],
      patterns: ["Use this fallback review as a manual reflection starter."],
      nextWeekSuggestions: ["Choose one goal to prioritize and schedule the first small action."],
    },
    {
      summary: "AI note summary is temporarily unavailable. Review the note and capture the key takeaway manually.",
      keyPoints: ["Mark the most important idea from the note."],
      possibleNextActions: ["Turn one useful idea into a small task if it supports an active goal."],
      relatedGoalSuggestions: [],
      relatedTaskSuggestions: [],
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
