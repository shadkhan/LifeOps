import "server-only";

import {
  dailyPlannerResponseSchema,
  habitGenerationResponseSchema,
  weeklyReviewResponseSchema,
} from "@lifeops/shared";
import { getAIProvider } from "./providers";
import {
  dailyPlannerPrompt,
  habitGenerationPrompt,
  lifeOpsSystemPrompt,
  weeklyReviewPrompt,
} from "./prompts/lifeops";

export async function generateHabitsFromGoal(goal: {
  title: string;
  description?: string | null;
  targetDate?: string | null;
}) {
  return getAIProvider().generateJSON({
    schema: habitGenerationResponseSchema,
    messages: [
      { role: "system", content: lifeOpsSystemPrompt },
      { role: "user", content: habitGenerationPrompt(goal) },
    ],
  });
}

export async function generateDailyPlan(context: string) {
  return getAIProvider().generateJSON({
    schema: dailyPlannerResponseSchema,
    messages: [
      { role: "system", content: lifeOpsSystemPrompt },
      { role: "user", content: dailyPlannerPrompt(context) },
    ],
  });
}

export async function generateWeeklyReview(context: string) {
  return getAIProvider().generateJSON({
    schema: weeklyReviewResponseSchema,
    messages: [
      { role: "system", content: lifeOpsSystemPrompt },
      { role: "user", content: weeklyReviewPrompt(context) },
    ],
  });
}
