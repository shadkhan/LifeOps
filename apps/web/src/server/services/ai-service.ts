import "server-only";

import { db, type AIProvider } from "@lifeops/db";
import {
  generateHabitsFromGoalPrompt,
  generateWeeklyReviewPrompt,
  lifeOpsAISystemPrompt,
  planMyDayPrompt,
  summarizeNotePrompt,
  suggestNextActionsForGoalPrompt,
} from "@/lib/ai/prompts";
import { createAIClient } from "@/lib/ai/clients";
import {
  aiOutputSchemas,
  aiModelOptions,
  aiZodSchemas,
  type AIProviderId,
  type AIServiceResult,
  type GenerateHabitsFromGoalInput,
  type PlanMyDayInput,
  type SuggestNextActionsForGoalInput,
  type SummarizeNoteInput,
  type WeeklyReviewInput,
} from "@/lib/ai/types";

const DEFAULT_PROVIDER: AIProvider = "groq";
const DEFAULT_MODEL = aiModelOptions.groq[0] ?? "llama-3.1-8b-instant";

export async function getAISettings() {
  return db.aiSettings.upsert({
    where: { id: "global" },
    update: {},
    create: {
      id: "global",
      provider: DEFAULT_PROVIDER,
      model: process.env.GROQ_MODEL || DEFAULT_MODEL,
    },
  });
}

export async function updateAISettings(input: { provider: AIProvider; model: string }) {
  return db.aiSettings.upsert({
    where: { id: "global" },
    update: {
      provider: input.provider,
      model: input.model,
    },
    create: {
      id: "global",
      provider: input.provider,
      model: input.model,
    },
  });
}

export async function generateHabitsFromGoal(
  input: GenerateHabitsFromGoalInput,
): Promise<AIServiceResult<typeof aiZodSchemas.habits._type>> {
  return runAI("habits", generateHabitsFromGoalPrompt(input));
}

export async function planMyDay(input: PlanMyDayInput): Promise<AIServiceResult<typeof aiZodSchemas.dayPlan._type>> {
  return runAI("dayPlan", planMyDayPrompt(input));
}

export async function generateWeeklyReview(
  input: WeeklyReviewInput,
): Promise<AIServiceResult<typeof aiZodSchemas.weeklyReview._type>> {
  return runAI("weeklyReview", generateWeeklyReviewPrompt(input));
}

export async function summarizeNote(
  input: SummarizeNoteInput,
): Promise<AIServiceResult<typeof aiZodSchemas.noteSummary._type>> {
  return runAI("noteSummary", summarizeNotePrompt(input));
}

export async function suggestNextActionsForGoal(
  input: SuggestNextActionsForGoalInput,
): Promise<AIServiceResult<typeof aiZodSchemas.nextActions._type>> {
  return runAI("nextActions", suggestNextActionsForGoalPrompt(input));
}

async function runAI<TKey extends keyof typeof aiOutputSchemas & keyof typeof aiZodSchemas>(
  key: TKey,
  userPrompt: string,
): Promise<AIServiceResult<(typeof aiZodSchemas)[TKey]["_type"]>> {
  const settings = await getAISettings();
  const provider = settings.provider.toLowerCase() as AIProviderId;
  const model = settings.model;

  try {
    const client = createAIClient(settings.provider);
    const data = await client.generateJson({
      model,
      output: aiOutputSchemas[key],
      schema: aiZodSchemas[key],
      messages: [
        { role: "system", content: lifeOpsAISystemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
    });

    return {
      ok: true,
      data,
      provider,
      model,
    };
  } catch (error) {
    return {
      ok: false,
      error: getSafeErrorMessage(error),
      provider,
      model,
    };
  }
}

function getSafeErrorMessage(error: unknown) {
  if (error instanceof Error) {
    if (error.message.includes("API_KEY")) {
      return error.message;
    }

    return "AI request failed. Check provider settings, model access, and server logs.";
  }

  return "AI request failed unexpectedly.";
}
