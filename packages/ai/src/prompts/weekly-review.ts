import "server-only";

import { buildAIPrompt, type JsonObject } from "../prompt-builder";

export type WeeklyReviewPromptContext = {
  weekStart: string;
  weekEnd: string;
  goals: Array<{ title: string; progress: number; status: string }>;
  completedTasks: Array<{ title: string }>;
  incompleteTasks?: Array<{ title: string; status: string; dueDate?: string | null }>;
  habitLogs: Array<{ habitName: string; completed: boolean; date: string; reflection?: string | null }>;
  notes: Array<{ title: string; body: string }>;
  dailyPlans?: Array<{ date: string; priorities: string[]; reflectionPrompt?: string | null }>;
};

const weeklyReviewOutputShape: JsonObject = {
  summary: "Short weekly summary",
  wins: ["Win"],
  gaps: ["Gap"],
  patterns: ["Pattern noticed"],
  habitInsights: ["Habit insight"],
  goalProgress: ["Goal progress insight"],
  nextWeekSuggestions: ["Suggestion for next week"],
};

export function buildWeeklyReviewPrompt(context: WeeklyReviewPromptContext) {
  return buildAIPrompt({
    workflow: "AI Weekly Review",
    task: "Create a weekly review from completed work, incomplete work, habit logs, goal progress, notes, and daily plans.",
    context,
    outputShape: weeklyReviewOutputShape,
    extraRules: [
      "Be honest and specific without shaming the user.",
      "Do not overstate progress when the context is thin.",
      "Keep next-week suggestions actionable and limited.",
    ],
  });
}
