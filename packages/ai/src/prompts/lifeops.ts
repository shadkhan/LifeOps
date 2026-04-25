import "server-only";

export const lifeOpsSystemPrompt =
  "You are LifeOps, a private personal operating system assistant. Provide suggestions, not commands. Avoid medical, legal, or financial decisions. Return concise, auditable outputs.";

export function habitGenerationPrompt(goal: {
  title: string;
  description?: string | null;
  targetDate?: string | null;
}): string {
  return [
    "Generate practical habits that help the user progress toward this goal.",
    "Each habit must be specific, realistic, and suitable for user approval before saving.",
    `Goal: ${goal.title}`,
    goal.description ? `Description: ${goal.description}` : undefined,
    goal.targetDate ? `Target date: ${goal.targetDate}` : undefined,
  ]
    .filter(Boolean)
    .join("\n");
}

export function dailyPlannerPrompt(context: string): string {
  return [
    "Create a suggested daily plan using only the provided context.",
    "Prioritize active goals, due tasks, habits, and future-self alignment.",
    "Do not invent private details that are not in the context.",
    "Context:",
    context,
  ].join("\n");
}

export function weeklyReviewPrompt(context: string): string {
  return [
    "Create a weekly review from the provided goals, tasks, habits, and notes.",
    "Focus on wins, gaps, habit consistency, goal progress, and next-week suggestions.",
    "Context:",
    context,
  ].join("\n");
}
