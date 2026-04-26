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
import { createAIClient } from "@/lib/ai/clients";
import {
  aiOutputSchemas,
  aiModelOptions,
  aiZodSchemas,
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
    const parsedFallback = aiZodSchemas[key].safeParse(fallback);

    if (parsedFallback.success) {
      return {
        ok: true,
        data: parsedFallback.data,
        provider,
        model: "fallback",
      };
    }

    return {
      ok: false,
      error: getSafeErrorMessage(error),
      provider,
      model,
    };
  }
}

function fallbackFutureSelf(prompt: string) {
  return {
    title: "Future Self Draft",
    description: prompt || "A calm, practical version of myself who acts consistently on what matters.",
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
    if (error.message.includes("API_KEY")) {
      return error.message;
    }

    return "AI request failed. Check provider settings, model access, and server logs.";
  }

  return "AI request failed unexpectedly.";
}
