import "server-only";

import { buildAIPrompt, type JsonObject } from "../prompt-builder";

export type GoalsFromFutureSelfContext = {
  futureSelf: string;
  lifeAreas: Array<{ id?: string; name: string; type?: string; vision?: string | null; gap?: string | null }>;
  existingGoals?: Array<{ title: string; status: string }>;
};

export type GoalBreakdownPromptInput = {
  title: string;
  description?: string | null;
  lifeArea?: string | null;
  priority?: string;
  progress?: number;
  targetDate?: string | Date | null;
  tasks?: Array<{ title: string; status: string }>;
  habits?: Array<{ name: string; status: string; streak?: number }>;
};

const goalOutputShape: JsonObject = {
  goals: [
    {
      title: "Specific goal title",
      description: "What outcome this goal creates",
      lifeAreaName: "Existing life area name",
      priority: "medium",
      targetDate: "Optional ISO date",
      reason: "Why this supports the future self",
    },
  ],
};

const goalBreakdownOutputShape: JsonObject = {
  summary: "Short breakdown summary",
  milestones: ["Milestone"],
  habits: [{ name: "Habit", description: "Optional detail", frequency: "daily", reason: "Why it helps" }],
  tasks: [{ title: "Task", description: "Optional detail", priority: "medium", sourceType: "goal", reason: "Why it matters" }],
  risks: ["Risk to watch"],
  successMetrics: ["How progress will be measured"],
};

export function buildGoalsFromFutureSelfPrompt(context: GoalsFromFutureSelfContext) {
  return buildAIPrompt({
    workflow: "Goals from Future Self",
    task: "Generate 3-8 reviewable goals that convert the Future Self and life areas into concrete outcomes.",
    context,
    outputShape: goalOutputShape,
    extraRules: [
      "Use only supplied lifeAreaName values when possible.",
      "Priority must be low, medium, or high.",
      "Avoid duplicating existing goals.",
    ],
  });
}

export function buildGoalBreakdownPrompt(goal: GoalBreakdownPromptInput) {
  return buildAIPrompt({
    workflow: "Goal Breakdown",
    task: "Break the goal into practical milestones, habits, tasks, risks, and success metrics.",
    context: {
      ...goal,
      targetDate: normalizeDate(goal.targetDate),
    },
    outputShape: goalBreakdownOutputShape,
    extraRules: [
      "Habit frequency must be daily, weekdays, weekly, monthly, or custom.",
      "Task priority must be low, medium, or high.",
      "Generated tasks and habits must be suitable for user selection before saving.",
    ],
  });
}

function normalizeDate(value: string | Date | null | undefined) {
  return value instanceof Date ? value.toISOString().slice(0, 10) : value ?? null;
}
