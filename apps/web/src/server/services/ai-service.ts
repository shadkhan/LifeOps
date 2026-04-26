import "server-only";

import { db, type AIProvider } from "@lifeops/db";
import {
  breakDownGoalPrompt,
  createTasksPrompt,
  expandIdeaPrompt,
  generateFutureSelfProfilePrompt,
  generateGoalsFromFutureSelfPrompt,
  generateHabitsFromGoalPrompt,
  generateWeeklyReviewPrompt,
  lifeOpsAISystemPrompt,
  planMyDayPrompt,
  suggestHabitsFromContextPrompt,
  summarizeNotePrompt,
  suggestNextActionsForGoalPrompt,
} from "@/lib/ai/prompts";
import { createAIClient, getServerEnv } from "@/lib/ai/clients";
import {
  aiOutputSchemas,
  aiModelOptions,
  aiZodSchemas,
  type AIUsage,
  type AIProviderId,
  type AIServiceResult,
  type BreakDownGoalInput,
  type CreateTasksInput,
  type ExpandIdeaInput,
  type GenerateFutureSelfInput,
  type GenerateGoalsFromFutureSelfInput,
  type GenerateHabitsFromGoalInput,
  type PlanMyDayInput,
  type SuggestHabitsFromContextInput,
  type SuggestNextActionsForGoalInput,
  type SummarizeNoteInput,
  type WeeklyReviewInput,
} from "@/lib/ai/types";

const DEFAULT_PROVIDER = getDefaultProvider();
const DEFAULT_MODEL = getDefaultModel(DEFAULT_PROVIDER);
const AI_LOG_LIMIT = 50;

const PRICE_PER_MILLION_TOKENS: Record<string, { input: number; output: number }> = {
  "anthropic:claude-3-5-haiku-latest": { input: 0.8, output: 4 },
  "anthropic:claude-3-5-haiku-20241022": { input: 0.8, output: 4 },
  "anthropic:claude-3-5-sonnet-latest": { input: 3, output: 15 },
  "anthropic:claude-3-5-sonnet-20241022": { input: 3, output: 15 },
  "anthropic:claude-3-7-sonnet-latest": { input: 3, output: 15 },
  "anthropic:claude-3-7-sonnet-20250219": { input: 3, output: 15 },
  "anthropic:claude-sonnet-4-0": { input: 3, output: 15 },
  "anthropic:claude-sonnet-4-20250514": { input: 3, output: 15 },
  "anthropic:claude-haiku-4-5-20251001": { input: 1, output: 5 },
  "anthropic:claude-sonnet-4-5-20250929": { input: 3, output: 15 },
  "anthropic:claude-sonnet-4-6": { input: 3, output: 15 },
  "anthropic:claude-opus-4-5-20251101": { input: 15, output: 75 },
  "anthropic:claude-opus-4-6": { input: 15, output: 75 },
  "anthropic:claude-opus-4-7": { input: 15, output: 75 },
  "openai:gpt-4o-mini": { input: 0.15, output: 0.6 },
  "openai:gpt-4o": { input: 2.5, output: 10 },
  "openai:gpt-4.1-mini": { input: 0.4, output: 1.6 },
  "groq:llama-3.1-8b-instant": { input: 0.05, output: 0.08 },
  "groq:llama-3.3-70b-versatile": { input: 0.59, output: 0.79 },
  "groq:meta-llama/llama-4-scout-17b-16e-instruct": { input: 0.11, output: 0.34 },
};

export async function getAISettings() {
  return db.aiSettings.upsert({
    where: { id: "global" },
    update: {},
    create: {
      id: "global",
      provider: DEFAULT_PROVIDER,
      model: DEFAULT_MODEL,
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

export async function getAIUsageDashboard() {
  const logs = await db.aiUsageLog.findMany({
    orderBy: { createdAt: "desc" },
    take: AI_LOG_LIMIT,
  });

  const [total, successful, failed, fallback, totals] = await Promise.all([
    db.aiUsageLog.count(),
    db.aiUsageLog.count({ where: { status: "success" } }),
    db.aiUsageLog.count({ where: { status: "error" } }),
    db.aiUsageLog.count({ where: { status: "fallback" } }),
    db.aiUsageLog.aggregate({
      _sum: {
        inputTokens: true,
        outputTokens: true,
        totalTokens: true,
        estimatedCostUsd: true,
      },
    }),
  ]);

  return {
    logs,
    summary: {
      total,
      successful,
      failed,
      fallback,
      inputTokens: totals._sum.inputTokens ?? 0,
      outputTokens: totals._sum.outputTokens ?? 0,
      totalTokens: totals._sum.totalTokens ?? 0,
      estimatedCostUsd: Number(totals._sum.estimatedCostUsd ?? 0),
    },
  };
}

export async function generateHabitsFromGoal(
  input: GenerateHabitsFromGoalInput,
): Promise<AIServiceResult<typeof aiZodSchemas.habits._type>> {
  return runAI("habits", generateHabitsFromGoalPrompt(input), fallbackForHabits(input.title));
}

export async function generateFutureSelfProfile(
  input: GenerateFutureSelfInput,
): Promise<AIServiceResult<typeof aiZodSchemas.futureSelfProfile._type>> {
  return runAI("futureSelfProfile", generateFutureSelfProfilePrompt(input), fallbackFutureSelf(input.prompt));
}

export async function generateGoalsFromFutureSelf(
  input: GenerateGoalsFromFutureSelfInput,
): Promise<AIServiceResult<typeof aiZodSchemas.goalsFromFutureSelf._type>> {
  return runAI("goalsFromFutureSelf", generateGoalsFromFutureSelfPrompt(input), {
    goals: input.lifeAreas.slice(0, 5).map((area) => ({
      title: `Build a stronger ${area.name.toLowerCase()} rhythm`,
      description: area.vision ?? `Create a practical outcome for ${area.name}.`,
      lifeAreaName: area.name,
      priority: "medium" as const,
      reason: "Fallback suggestion based on the selected life area.",
    })),
  });
}

export async function breakDownGoal(
  input: BreakDownGoalInput,
): Promise<AIServiceResult<typeof aiZodSchemas.goalBreakdown._type>> {
  return runAI("goalBreakdown", breakDownGoalPrompt(input), {
    summary: `Turn "${input.title}" into weekly progress with one planning task, one execution habit, and one review checkpoint.`,
    milestones: ["Clarify the first measurable outcome", "Complete the first weekly action", "Review progress and adjust"],
    habits: fallbackForHabits(input.title).habits.slice(0, 2),
    tasks: fallbackTasks(input.title, "goal").tasks,
    risks: ["Scope may be too broad without a weekly checkpoint"],
    successMetrics: ["Progress percentage updated weekly", "At least one linked task completed"],
  });
}

export async function suggestHabitsFromContext(
  input: SuggestHabitsFromContextInput,
): Promise<AIServiceResult<typeof aiZodSchemas.habitSuggestions._type>> {
  const title = input.goals[0]?.title ?? "current life context";
  return runAI("habitSuggestions", suggestHabitsFromContextPrompt(input), fallbackForHabits(title));
}

export async function createTasksFromSource(
  input: CreateTasksInput,
): Promise<AIServiceResult<typeof aiZodSchemas.taskCreation._type>> {
  return runAI("taskCreation", createTasksPrompt(input), fallbackTasks(input.sourceTitle, input.sourceType));
}

export async function expandIdea(input: ExpandIdeaInput): Promise<AIServiceResult<typeof aiZodSchemas.ideaExpansion._type>> {
  return runAI("ideaExpansion", expandIdeaPrompt(input), {
    title: "Expanded idea",
    summary: input.idea,
    whyItMatters: "This may become useful if it supports your future self or an active goal.",
    nextSteps: fallbackTasks("Explore this idea", "idea").tasks,
    relatedHabits: fallbackForHabits("Explore this idea").habits.slice(0, 1),
    questions: ["What outcome would make this idea worth pursuing?", "What is the smallest next test?"],
  });
}

export async function planMyDay(input: PlanMyDayInput): Promise<AIServiceResult<typeof aiZodSchemas.dayPlan._type>> {
  return runAI("dayPlan", planMyDayPrompt(input), {
    date: input.date,
    dailyFocus: input.goals[0]?.title ?? "Make steady progress on one meaningful priority",
    priorities: input.tasks.slice(0, 3).map((task) => task.title).concat(input.goals[0]?.title ? [] : ["Review priorities"]),
    plan: [
      {
        title: "Focus block",
        focus: input.tasks[0]?.title ?? "Choose one task and complete the next visible step.",
        linkedGoalId: input.tasks[0]?.id,
      },
    ],
    habitsToComplete: input.habits.slice(0, 5).map((habit) => habit.name),
    suggestedTasks: [],
    avoidList: ["Starting too many unrelated tasks at once"],
    improvementSuggestion: "Choose one small action that proves the day is moving in the right direction.",
    reflectionPrompt: "What action today most supported your future self?",
  });
}

export async function generateWeeklyReview(
  input: WeeklyReviewInput,
): Promise<AIServiceResult<typeof aiZodSchemas.weeklyReview._type>> {
  return runAI("weeklyReview", generateWeeklyReviewPrompt(input), {
    summary: `Reviewed the week of ${input.weekStart} through ${input.weekEnd}.`,
    wins: input.completedTasks.slice(0, 5).map((task) => `Completed: ${task.title}`),
    gaps: input.incompleteTasks?.slice(0, 5).map((task) => `Still open: ${task.title}`) ?? [],
    patterns: ["Use this fallback review as a manual starting point."],
    habitInsights: [`${input.habitLogs.filter((log) => log.completed).length} habit completions logged.`],
    goalProgress: input.goals.slice(0, 5).map((goal) => `${goal.title}: ${goal.progress}% (${goal.status})`),
    nextWeekSuggestions: ["Pick one goal to advance first next week."],
  });
}

export async function summarizeNote(
  input: SummarizeNoteInput,
): Promise<AIServiceResult<typeof aiZodSchemas.noteSummary._type>> {
  return runAI("noteSummary", summarizeNotePrompt(input), {
    summary: input.body.slice(0, 500) || input.title,
    keyPoints: [input.title],
    possibleNextActions: ["Review this note and decide whether it should become a task."],
    relatedGoalSuggestions: [],
    relatedTaskSuggestions: [],
  });
}

export async function suggestNextActionsForGoal(
  input: SuggestNextActionsForGoalInput,
): Promise<AIServiceResult<typeof aiZodSchemas.nextActions._type>> {
  return runAI("nextActions", suggestNextActionsForGoalPrompt(input), {
    actions: fallbackTasks(input.title, "goal").tasks.slice(0, 3).map((task) => ({
      title: task.title,
      reason: task.reason,
      effort: "medium" as const,
    })),
  });
}

async function runAI<TKey extends keyof typeof aiOutputSchemas & keyof typeof aiZodSchemas>(
  key: TKey,
  userPrompt: string,
  fallback: (typeof aiZodSchemas)[TKey]["_type"],
): Promise<AIServiceResult<(typeof aiZodSchemas)[TKey]["_type"]>> {
  const settings = await getAISettings();
  const provider = settings.provider.toLowerCase() as AIProviderId;
  const model = settings.model;
  const startedAt = Date.now();

  try {
    const client = createAIClient(settings.provider);
    const result = await client.generateJson({
      model,
      output: aiOutputSchemas[key],
      schema: aiZodSchemas[key],
      messages: [
        { role: "system", content: lifeOpsAISystemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
    });
    await logAIUsage({
      feature: key,
      provider,
      model,
      status: "success",
      usage: result.usage,
      latencyMs: Date.now() - startedAt,
    });

    return {
      ok: true,
      data: result.data,
      provider,
      model,
    };
  } catch (error) {
    const parsedFallback = aiZodSchemas[key].safeParse(fallback);
    const safeError = getSafeErrorMessage(error);

    if (parsedFallback.success) {
      await logAIUsage({
        feature: key,
        provider,
        model,
        status: "fallback",
        latencyMs: Date.now() - startedAt,
        errorMessage: safeError,
      });

      return {
        ok: true,
        data: parsedFallback.data,
        provider,
        model: "fallback",
      };
    }

    await logAIUsage({
      feature: key,
      provider,
      model,
      status: "error",
      latencyMs: Date.now() - startedAt,
      errorMessage: safeError,
    });

    return {
      ok: false,
      error: safeError,
      provider,
      model,
    };
  }
}

async function logAIUsage(input: {
  feature: string;
  provider: AIProviderId;
  model: string;
  status: "success" | "fallback" | "error";
  usage?: AIUsage;
  latencyMs: number;
  errorMessage?: string;
}) {
  try {
    await db.aiUsageLog.create({
      data: {
        feature: input.feature,
        provider: input.provider,
        model: input.model,
        status: input.status,
        inputTokens: input.usage?.inputTokens,
        outputTokens: input.usage?.outputTokens,
        totalTokens: input.usage?.totalTokens,
        estimatedCostUsd: estimateCostUsd(input.provider, input.model, input.usage),
        latencyMs: input.latencyMs,
        errorMessage: input.errorMessage,
      },
    });
  } catch (error) {
    console.error("Failed to write AI usage log", error);
  }
}

function estimateCostUsd(provider: AIProviderId, model: string, usage?: AIUsage) {
  const rate = PRICE_PER_MILLION_TOKENS[`${provider}:${model}`];
  if (!rate || !usage) {
    return undefined;
  }

  const inputCost = ((usage.inputTokens ?? 0) / 1_000_000) * rate.input;
  const outputCost = ((usage.outputTokens ?? 0) / 1_000_000) * rate.output;
  return Number((inputCost + outputCost).toFixed(6));
}

function getDefaultProvider(): AIProvider {
  const envProvider = getServerEnv("AI_PROVIDER")?.toLowerCase();
  if (envProvider === "openai" || envProvider === "anthropic" || envProvider === "groq") {
    return envProvider;
  }

  return "groq";
}

function getDefaultModel(provider: AIProvider) {
  if (provider === "anthropic") {
    return getServerEnv("ANTHROPIC_MODEL") || aiModelOptions.anthropic[0] || "claude-3-5-haiku-latest";
  }

  if (provider === "openai") {
    return getServerEnv("OPENAI_DEFAULT_MODEL") || aiModelOptions.openai[0] || "gpt-4o-mini";
  }

  return getServerEnv("GROQ_DEFAULT_MODEL") || getServerEnv("GROQ_MODEL") || aiModelOptions.groq[0] || "llama-3.1-8b-instant";
}

function fallbackFutureSelf(prompt: string) {
  return {
    title: "Future Self Draft",
    description:
      prompt ||
      "This future self lives with clearer priorities, steadier energy, and a practical rhythm for making progress. The profile balances focused work, health, reflection, and consistent execution without relying on intensity or burnout.",
    identityStatement: "I am becoming someone who turns clear intentions into steady daily action.",
    lifeAreas: [
      {
        name: "Health",
        type: "health" as const,
        vision: "Maintain the energy needed for focused work and personal life.",
        currentReality: "Needs a simple baseline routine.",
        gap: "Turn intention into repeatable habits.",
      },
      {
        name: "Career",
        type: "career" as const,
        vision: "Make consistent progress on meaningful work.",
        currentReality: "Needs clearer weekly priorities.",
        gap: "Connect daily tasks to larger goals.",
      },
    ],
    suggestedGoals: [
      {
        title: "Build a consistent weekly execution rhythm",
        description: "Choose, complete, and review a small set of meaningful weekly actions.",
        lifeAreaName: "Career",
        priority: "medium" as const,
        reason: "A weekly rhythm supports disciplined progress without overloading the day.",
      },
      {
        title: "Create a simple health baseline",
        description: "Build repeatable habits that protect energy and focus.",
        lifeAreaName: "Health",
        priority: "medium" as const,
        reason: "Energy is a foundation for the future self described in the prompt.",
      },
    ],
    suggestedHabits: [
      {
        name: "Daily priority review",
        description: "Pick the one action that best supports the future self today.",
        frequency: "daily" as const,
        suggestedReminderTime: "09:00",
        reason: "A small planning ritual makes consistency visible.",
        lifeAreaName: "Career",
        goalTitle: "Build a consistent weekly execution rhythm",
      },
      {
        name: "Weekly progress reflection",
        description: "Review what moved forward and choose next week's first action.",
        frequency: "weekly" as const,
        reason: "Reflection keeps goals honest and adjustable.",
        lifeAreaName: "Career",
        goalTitle: "Build a consistent weekly execution rhythm",
      },
    ],
  };
}

function fallbackForHabits(goalTitle: string) {
  return {
    habits: [
      {
        name: "Five-minute progress review",
        description: `Review the next step for ${goalTitle}.`,
        frequency: "daily" as const,
        suggestedReminderTime: "09:00",
        reason: "A short review keeps the goal visible before the day fills up.",
      },
      {
        name: "One focused action block",
        description: `Spend one uninterrupted block on ${goalTitle}.`,
        frequency: "weekdays" as const,
        suggestedReminderTime: "10:00",
        reason: "Small consistent execution creates progress without overplanning.",
      },
      {
        name: "Weekly progress checkpoint",
        description: `Update progress and choose next steps for ${goalTitle}.`,
        frequency: "weekly" as const,
        reason: "A weekly checkpoint keeps the habit tied to measurable progress.",
      },
    ],
  };
}

function fallbackTasks(title: string, sourceType: "goal" | "habit" | "note" | "idea") {
  return {
    tasks: [
      {
        title: `Clarify the next step for ${title}`,
        description: "Write the smallest useful action and the expected outcome.",
        priority: "medium" as const,
        sourceType,
        reason: "Clarity makes the work easier to start.",
      },
      {
        title: `Schedule a focused block for ${title}`,
        description: "Reserve time to complete the next visible action.",
        priority: "medium" as const,
        sourceType,
        reason: "A time block turns intention into execution.",
      },
      {
        title: `Review progress on ${title}`,
        description: "Check what changed and decide the next action.",
        priority: "low" as const,
        sourceType,
        reason: "Review prevents stale goals and tasks.",
      },
    ],
  };
}

function getSafeErrorMessage(error: unknown) {
  if (error instanceof Error) {
    if (
      error.message.includes("API_KEY") ||
      error.message.includes("request failed with status") ||
      error.message.includes("returned an empty response") ||
      error.message.includes("AI response did not contain JSON")
    ) {
      return error.message;
    }

    return "AI request failed. Check provider settings, model access, and server logs.";
  }

  return "AI request failed unexpectedly.";
}
