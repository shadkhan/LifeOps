import "server-only";

import { buildAIPrompt, type JsonObject } from "../prompt-builder";

export type DailyPlannerPromptContext = {
  date: string;
  futureSelf?: string | null;
  goals: Array<{ id?: string; title: string; priority?: string; progress?: number }>;
  tasks: Array<{ id?: string; title: string; priority?: string; dueDate?: string | null }>;
  overdueTasks?: Array<{ id?: string; title: string; priority?: string; dueDate?: string | null }>;
  habits: Array<{ id?: string; name: string; streak?: number }>;
  notes?: Array<{ title: string; body: string }>;
};

const dailyPlannerOutputShape: JsonObject = {
  date: "YYYY-MM-DD",
  dailyFocus: "One sentence focus",
  priorities: ["Top priority"],
  plan: [{ title: "Schedule block", startTime: "Optional HH:mm", endTime: "Optional HH:mm", focus: "Block focus" }],
  habitsToComplete: ["Habit name"],
  suggestedTasks: [{ title: "Optional suggested task", reason: "Why it helps", linkedGoalId: "Optional goal id" }],
  avoidList: ["Thing to avoid"],
  improvementSuggestion: "One improvement suggestion",
  reflectionPrompt: "End-of-day reflection question",
};

export function buildDailyPlannerPrompt(context: DailyPlannerPromptContext) {
  return buildAIPrompt({
    workflow: "AI Daily Planner",
    task: "Create a focused day plan from the supplied future self, goals, tasks, habits, and notes.",
    context,
    outputShape: dailyPlannerOutputShape,
    extraRules: [
      "Prioritize due and overdue tasks before optional suggestions.",
      "Keep schedule blocks realistic and flexible.",
      "Do not include more than five priorities.",
    ],
  });
}
