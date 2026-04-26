import "server-only";

import type { z } from "zod";
import {
  dailyPlannerResponseSchema,
  futureSelfProfileGenerationSchema,
  goalBreakdownSchema,
  goalsFromFutureSelfSchema,
  habitGenerationResponseSchema,
  habitSuggestionsSchema,
  ideaExpansionSchema,
  noteSummarySchema,
  taskCreationSchema,
  weeklyReviewResponseSchema,
  type DailyPlannerResponse,
  type FutureSelfProfileGeneration,
  type GoalBreakdown,
  type GoalsFromFutureSelf,
  type HabitGenerationResponse,
  type HabitSuggestions,
  type IdeaExpansion,
  type NoteSummary,
  type TaskCreation,
  type WeeklyReviewResponse,
} from "@lifeops/shared";
import { parseJsonSafely } from "./json-repair";
import { buildDailyPlannerPrompt, type DailyPlannerPromptContext } from "./prompts/daily-planner";
import { buildFutureSelfPrompt, type FutureSelfPromptInput } from "./prompts/future-self";
import {
  buildGoalBreakdownPrompt,
  buildGoalsFromFutureSelfPrompt,
  type GoalBreakdownPromptInput,
  type GoalsFromFutureSelfContext,
} from "./prompts/goals";
import {
  buildHabitSuggestionsPrompt,
  buildHabitsFromGoalPrompt,
  type HabitsFromGoalPromptInput,
  type HabitSuggestionsContext,
} from "./prompts/habits";
import { buildIdeaExpansionPrompt, type IdeaExpansionPromptInput } from "./prompts/ideas";
import { lifeOpsSystemPrompt } from "./prompt-builder";
import { buildNoteSummaryPrompt, type NoteSummaryPromptInput } from "./prompts/notes";
import { buildTaskCreationPrompt, type TaskCreationSource } from "./prompts/tasks";
import { buildWeeklyReviewPrompt, type WeeklyReviewPromptContext } from "./prompts/weekly-review";
import { createFallbackJSON } from "./providers/fallback";
import { getAIProvider } from "./providers";
import type { AIMessage, AIProvider } from "./providers/types";

export type AIServiceSuccess<T> = {
  ok: true;
  data: T;
  provider: string;
  fallback: boolean;
};

export type AIServiceFailure = {
  ok: false;
  error: string;
  provider?: string;
  fallback: false;
};

export type AIServiceResult<T> = AIServiceSuccess<T> | AIServiceFailure;

type ProviderResult =
  | {
      ok: true;
      provider: AIProvider;
    }
  | AIServiceFailure;

export async function generateFutureSelfProfile(
  input: FutureSelfPromptInput,
): Promise<AIServiceResult<FutureSelfProfileGeneration>> {
  return generateValidatedJson({
    schema: futureSelfProfileGenerationSchema,
    prompt: buildFutureSelfPrompt(input),
  });
}

export async function generateGoalsFromFutureSelf(
  context: GoalsFromFutureSelfContext,
): Promise<AIServiceResult<GoalsFromFutureSelf>> {
  return generateValidatedJson({
    schema: goalsFromFutureSelfSchema,
    prompt: buildGoalsFromFutureSelfPrompt(context),
  });
}

export async function breakdownGoal(goal: GoalBreakdownPromptInput): Promise<AIServiceResult<GoalBreakdown>> {
  return generateValidatedJson({
    schema: goalBreakdownSchema,
    prompt: buildGoalBreakdownPrompt(goal),
  });
}

export async function generateHabitsFromGoal(
  goal: HabitsFromGoalPromptInput,
): Promise<AIServiceResult<HabitGenerationResponse>> {
  return generateValidatedJson({
    schema: habitGenerationResponseSchema,
    prompt: buildHabitsFromGoalPrompt(goal),
  });
}

export async function suggestHabits(context: HabitSuggestionsContext): Promise<AIServiceResult<HabitSuggestions>> {
  return generateValidatedJson({
    schema: habitSuggestionsSchema,
    prompt: buildHabitSuggestionsPrompt(context),
  });
}

export async function summarizeNote(note: NoteSummaryPromptInput): Promise<AIServiceResult<NoteSummary>> {
  return generateValidatedJson({
    schema: noteSummarySchema,
    prompt: buildNoteSummaryPrompt(note),
  });
}

export async function createTasksFromSource(source: TaskCreationSource): Promise<AIServiceResult<TaskCreation>> {
  return generateValidatedJson({
    schema: taskCreationSchema,
    prompt: buildTaskCreationPrompt(source),
  });
}

export async function expandIdea(idea: IdeaExpansionPromptInput): Promise<AIServiceResult<IdeaExpansion>> {
  return generateValidatedJson({
    schema: ideaExpansionSchema,
    prompt: buildIdeaExpansionPrompt(idea),
  });
}

export async function planDay(context: DailyPlannerPromptContext): Promise<AIServiceResult<DailyPlannerResponse>> {
  return generateValidatedJson({
    schema: dailyPlannerResponseSchema,
    prompt: buildDailyPlannerPrompt(context),
  });
}

export async function generateWeeklyReview(
  context: WeeklyReviewPromptContext,
): Promise<AIServiceResult<WeeklyReviewResponse>> {
  return generateValidatedJson({
    schema: weeklyReviewResponseSchema,
    prompt: buildWeeklyReviewPrompt(context),
  });
}

async function generateValidatedJson<TSchema extends z.ZodType>(input: {
  schema: TSchema;
  prompt: string;
}): Promise<AIServiceResult<z.infer<TSchema>>> {
  const providerResult = getProviderSafely();

  if (!providerResult.ok) {
    return providerResult;
  }

  const { provider } = providerResult;

  try {
    const firstRaw = await provider.generateText({
      messages: buildMessages(input.prompt),
      temperature: 0.1,
    });
    const firstParsed = parseJsonSafely(firstRaw, input.schema);

    if (firstParsed.ok) {
      return {
        ok: true,
        data: firstParsed.data,
        provider: provider.name,
        fallback: provider.name === "fallback",
      };
    }

    const retryRaw = await provider.generateText({
      messages: [
        ...buildMessages(input.prompt),
        {
          role: "user",
          content: [
            "The previous response was invalid JSON or failed schema validation.",
            "Return corrected JSON only that matches the expected output shape.",
            `Validation error: ${firstParsed.error}`,
            `Invalid response: ${firstParsed.raw.slice(0, 3000)}`,
          ].join("\n"),
        },
      ],
      temperature: 0,
    });
    const retryParsed = parseJsonSafely(retryRaw, input.schema);

    if (retryParsed.ok) {
      return {
        ok: true,
        data: retryParsed.data,
        provider: provider.name,
        fallback: provider.name === "fallback",
      };
    }

    return getFallbackResult(input.schema, provider.name);
  } catch (error) {
    if (isFallbackEnabled()) {
      return getFallbackResult(input.schema, provider.name);
    }

    return {
      ok: false,
      error: getSafeErrorMessage(error),
      provider: provider.name,
      fallback: false,
    };
  }
}

function getProviderSafely(): ProviderResult {
  try {
    return {
      ok: true,
      provider: getAIProvider(),
    };
  } catch (error) {
    if (isFallbackEnabled()) {
      return {
        ok: true,
        provider: {
          name: "fallback",
          async generateText() {
            return "{}";
          },
          async generateJSON(options) {
            return createFallbackJSON(options.schema);
          },
        },
      };
    }

    return {
      ok: false,
      error: getSafeErrorMessage(error),
      fallback: false,
    };
  }
}

function getFallbackResult<TSchema extends z.ZodType>(
  schema: TSchema,
  provider: string,
): AIServiceResult<z.infer<TSchema>> {
  if (!isFallbackEnabled()) {
    return {
      ok: false,
      error: "AI response could not be validated. Please use the manual workflow.",
      provider,
      fallback: false,
    };
  }

  try {
    return {
      ok: true,
      data: createFallbackJSON(schema),
      provider,
      fallback: true,
    };
  } catch {
    return {
      ok: false,
      error: "AI is unavailable and no safe fallback exists for this workflow.",
      provider,
      fallback: false,
    };
  }
}

function buildMessages(prompt: string): AIMessage[] {
  return [
    {
      role: "system",
      content: lifeOpsSystemPrompt,
    },
    {
      role: "user",
      content: prompt,
    },
  ];
}

function isFallbackEnabled() {
  return process.env.AI_FALLBACK_ENABLED !== "false";
}

function getSafeErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.includes("required for the selected AI provider")) {
    return error.message;
  }

  return "AI request failed. Check provider settings or use the manual workflow.";
}
