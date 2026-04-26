import "server-only";

import { buildAIPrompt, type JsonObject } from "../prompt-builder";

export type HabitsFromGoalPromptInput = {
  title: string;
  description?: string | null;
  targetDate?: string | Date | null;
};

export type HabitSuggestionsContext = {
  futureSelf?: string | null;
  goals: Array<{ id?: string; title: string; lifeArea?: string; priority?: string; progress?: number }>;
  currentHabits: Array<{ name: string; frequency: string; goal?: string | null; streak?: number }>;
  recentNotes?: Array<{ title: string; body: string }>;
};

const habitOutputShape: JsonObject = {
  habits: [
    {
      name: "Small repeatable habit",
      description: "Optional save-ready description",
      frequency: "daily",
      suggestedReminderTime: "Optional HH:mm",
      reason: "Why this habit helps",
    },
  ],
};

export function buildHabitsFromGoalPrompt(goal: HabitsFromGoalPromptInput) {
  return buildAIPrompt({
    workflow: "Habits from Goal",
    task: "Generate 3-6 small, repeatable habits that support this goal.",
    context: {
      ...goal,
      targetDate: normalizeDate(goal.targetDate),
    },
    outputShape: habitOutputShape,
    extraRules: [
      "Frequency must be daily, weekdays, weekly, monthly, or custom.",
      "Avoid vague habits like 'be better'.",
    ],
  });
}

export function buildHabitSuggestionsPrompt(context: HabitSuggestionsContext) {
  return buildAIPrompt({
    workflow: "Habit Suggestions from Life Context",
    task: "Suggest 3-6 habits that improve the user's current LifeOps system without duplicating existing habits.",
    context,
    outputShape: habitOutputShape,
    extraRules: [
      "Prefer habits tied to active goals or future-self gaps.",
      "Frequency must be daily, weekdays, weekly, monthly, or custom.",
    ],
  });
}

function normalizeDate(value: string | Date | null | undefined) {
  return value instanceof Date ? value.toISOString().slice(0, 10) : value ?? null;
}
