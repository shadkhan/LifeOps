import "server-only";

import { lifeOpsSystemPrompt } from "../prompt-builder";
import { buildDailyPlannerPrompt } from "./daily-planner";
import { buildHabitsFromGoalPrompt } from "./habits";
import { buildWeeklyReviewPrompt } from "./weekly-review";

export { lifeOpsSystemPrompt };

export function habitGenerationPrompt(goal: {
  title: string;
  description?: string | null;
  targetDate?: string | null;
}): string {
  return buildHabitsFromGoalPrompt(goal);
}

export function dailyPlannerPrompt(context: string): string {
  return buildDailyPlannerPrompt({
    date: new Date().toISOString().slice(0, 10),
    futureSelf: null,
    goals: [],
    tasks: [],
    habits: [],
    notes: [{ title: "Raw planner context", body: context }],
  });
}

export function weeklyReviewPrompt(context: string): string {
  return buildWeeklyReviewPrompt({
    weekStart: "",
    weekEnd: "",
    goals: [],
    completedTasks: [],
    incompleteTasks: [],
    habitLogs: [],
    notes: [{ title: "Raw weekly review context", body: context }],
  });
}
