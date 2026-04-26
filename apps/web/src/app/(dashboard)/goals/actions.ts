"use server";

import { db, type GoalStatus, type HabitFrequency, type Priority } from "@lifeops/db";
import {
  generatedGoalSchema,
  generatedHabitSchema,
  generatedTaskSchema,
  goalBreakdownResponseSchema,
  goalSchema,
  goalStatusSchema,
  idSchema,
} from "@lifeops/shared";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { breakDownGoal, generateGoalsFromFutureSelf, generateHabitsFromGoal } from "@/server/services/ai-service";

export type GoalActionState = {
  ok: boolean;
  message: string;
};

export type GeneratedHabitSuggestion = {
  id: string;
  name: string;
  frequency: string;
  suggestedReminderTime?: string;
  reason: string;
};

export type GenerateHabitSuggestionsState = {
  ok: boolean;
  message: string;
  suggestions: GeneratedHabitSuggestion[];
};

export type GenerateGoalsState = {
  ok: boolean;
  message: string;
  suggestions: Array<z.infer<typeof generatedGoalSchema>>;
};

export type GoalBreakdownState = {
  ok: boolean;
  message: string;
  breakdown: z.infer<typeof goalBreakdownResponseSchema> | null;
};

const saveGeneratedHabitsSchema = z.object({
  goalId: idSchema,
  habits: z.array(generatedHabitSchema).min(1).max(10),
});

const saveGeneratedGoalsSchema = z.object({
  goals: z.array(generatedGoalSchema).min(1).max(10),
});

const saveBreakdownSchema = z.object({
  goalId: idSchema,
  habits: z.array(generatedHabitSchema).default([]),
  tasks: z.array(generatedTaskSchema).default([]),
});

const errorState = (message: string): GoalActionState => ({ ok: false, message });
const successState = (message: string): GoalActionState => ({ ok: true, message });

export async function createGoalAction(_: GoalActionState, formData: FormData): Promise<GoalActionState> {
  const user = await requireCurrentUser();
  const parsed = parseGoalForm(formData);

  if (!parsed.success) {
    return errorState(parsed.message);
  }

  const lifeArea = await db.lifeArea.findFirst({
    where: {
      id: parsed.data.lifeAreaId,
      userId: user.id,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (!lifeArea) {
    return errorState("Choose a valid life area.");
  }

  await db.goal.create({
    data: {
      userId: user.id,
      lifeAreaId: parsed.data.lifeAreaId,
      title: parsed.data.title,
      description: parsed.data.description,
      status: parsed.data.status as GoalStatus,
      priority: parsed.data.priority as Priority,
      targetDate: parsed.data.targetDate,
      progress: parsed.data.progress,
    },
  });

  revalidateGoals();
  return successState("Goal created.");
}

export async function updateGoalAction(_: GoalActionState, formData: FormData): Promise<GoalActionState> {
  const user = await requireCurrentUser();
  const goalId = idSchema.safeParse(readString(formData, "goalId"));

  if (!goalId.success) {
    return errorState("Invalid goal.");
  }

  const parsed = parseGoalForm(formData);

  if (!parsed.success) {
    return errorState(parsed.message);
  }

  const lifeArea = await db.lifeArea.findFirst({
    where: {
      id: parsed.data.lifeAreaId,
      userId: user.id,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (!lifeArea) {
    return errorState("Choose a valid life area.");
  }

  const result = await db.goal.updateMany({
    where: {
      id: goalId.data,
      userId: user.id,
    },
    data: {
      lifeAreaId: parsed.data.lifeAreaId,
      title: parsed.data.title,
      description: parsed.data.description,
      status: parsed.data.status as GoalStatus,
      priority: parsed.data.priority as Priority,
      targetDate: parsed.data.targetDate,
      progress: parsed.data.progress,
    },
  });

  if (result.count === 0) {
    return errorState("Goal not found.");
  }

  revalidateGoals(goalId.data);
  return successState("Goal updated.");
}

export async function updateGoalStatusAction(formData: FormData) {
  const user = await requireCurrentUser();
  const goalId = idSchema.safeParse(readString(formData, "goalId"));
  const status = goalStatusSchema.safeParse(readString(formData, "status"));

  if (!goalId.success || !status.success) {
    return;
  }

  await db.goal.updateMany({
    where: {
      id: goalId.data,
      userId: user.id,
    },
    data: {
      status: status.data as GoalStatus,
      progress: status.data === "completed" ? 100 : undefined,
    },
  });

  revalidateGoals(goalId.data);
}

export async function deleteGoalAction(formData: FormData) {
  const user = await requireCurrentUser();
  const goalId = idSchema.safeParse(readString(formData, "goalId"));
  const redirectTo = readString(formData, "redirectTo") || "/goals";

  if (!goalId.success) {
    return;
  }

  await db.goal.deleteMany({
    where: {
      id: goalId.data,
      userId: user.id,
    },
  });

  revalidateGoals(goalId.data);

  if (redirectTo === "/goals") {
    redirect("/goals");
  }
}

export async function generateGoalsFromFutureSelfAction(
  _: GenerateGoalsState,
  _formData: FormData,
): Promise<GenerateGoalsState> {
  const user = await requireCurrentUser();
  const futureSelf = await db.futureSelf.findUnique({
    where: { userId: user.id },
    include: { lifeAreas: { where: { deletedAt: null } } },
  });

  if (!futureSelf || futureSelf.lifeAreas.length === 0) {
    return { ok: false, message: "Create a Future Self and at least one life area first.", suggestions: [] };
  }

  const existingGoals = await db.goal.findMany({
    where: { userId: user.id },
    select: { title: true, status: true },
  });

  const result = await generateGoalsFromFutureSelf({
    futureSelf: `${futureSelf.title}\n${futureSelf.identityStatement}\n${futureSelf.description ?? ""}`,
    lifeAreas: futureSelf.lifeAreas.map((area) => ({
      id: area.id,
      name: area.name,
      type: area.type,
      vision: area.vision,
      gap: area.gap,
    })),
    existingGoals,
  });

  if (!result.ok) {
    return { ok: false, message: result.error, suggestions: [] };
  }

  return {
    ok: true,
    message: result.model === "fallback" ? "AI unavailable, so LifeOps created starter goal ideas." : "Goal suggestions generated.",
    suggestions: result.data.goals,
  };
}

export async function saveGeneratedGoalsAction(_: GoalActionState, formData: FormData): Promise<GoalActionState> {
  const user = await requireCurrentUser();
  const parsed = saveGeneratedGoalsSchema.safeParse({
    goals: parseJson(readString(formData, "goals")) ?? [],
  });

  if (!parsed.success) {
    return errorState(parsed.error.issues[0]?.message ?? "Choose at least one valid goal suggestion.");
  }

  const lifeAreas = await db.lifeArea.findMany({
    where: { userId: user.id, deletedAt: null },
    select: { id: true, name: true },
  });

  if (!lifeAreas.length) {
    return errorState("Create a life area before saving AI goals.");
  }

  const fallbackLifeAreaId = lifeAreas[0]?.id;

  if (!fallbackLifeAreaId) {
    return errorState("Create a life area before saving AI goals.");
  }

  await db.goal.createMany({
    data: parsed.data.goals.map((goal) => ({
      userId: user.id,
      lifeAreaId: lifeAreas.find((area) => area.name.toLowerCase() === goal.lifeAreaName.toLowerCase())?.id ?? fallbackLifeAreaId,
      title: goal.title,
      description: `${goal.description}\n\nAI rationale: ${goal.reason}`,
      priority: goal.priority as Priority,
      targetDate: parseOptionalDateValue(goal.targetDate),
      status: "active" as GoalStatus,
      progress: 0,
    })),
  });

  revalidateGoals();
  return successState("Selected goals saved.");
}

export async function breakDownGoalAction(_: GoalBreakdownState, formData: FormData): Promise<GoalBreakdownState> {
  const user = await requireCurrentUser();
  const goalId = idSchema.safeParse(readString(formData, "goalId"));

  if (!goalId.success) {
    return { ok: false, message: "Invalid goal.", breakdown: null };
  }

  const goal = await db.goal.findFirst({
    where: { id: goalId.data, userId: user.id },
    include: {
      lifeArea: { select: { name: true } },
      tasks: { select: { title: true, status: true } },
      habits: { select: { name: true, status: true, streak: true } },
    },
  });

  if (!goal) {
    return { ok: false, message: "Goal not found.", breakdown: null };
  }

  const result = await breakDownGoal({
    id: goal.id,
    title: goal.title,
    description: goal.description,
    lifeArea: goal.lifeArea.name,
    priority: goal.priority,
    progress: goal.progress,
    targetDate: goal.targetDate,
    tasks: goal.tasks,
    habits: goal.habits,
  });

  if (!result.ok) {
    return { ok: false, message: result.error, breakdown: null };
  }

  return {
    ok: true,
    message: result.model === "fallback" ? "AI unavailable, so LifeOps prepared a starter breakdown." : "Goal breakdown generated.",
    breakdown: result.data,
  };
}

export async function saveGoalBreakdownAction(_: GoalActionState, formData: FormData): Promise<GoalActionState> {
  const user = await requireCurrentUser();
  const parsed = saveBreakdownSchema.safeParse({
    goalId: readString(formData, "goalId"),
    habits: parseJson(readString(formData, "habits")) ?? [],
    tasks: parseJson(readString(formData, "tasks")) ?? [],
  });

  if (!parsed.success) {
    return errorState(parsed.error.issues[0]?.message ?? "Choose valid breakdown items.");
  }

  const goal = await db.goal.findFirst({
    where: { id: parsed.data.goalId, userId: user.id },
    select: { id: true },
  });

  if (!goal) {
    return errorState("Goal not found.");
  }

  await db.$transaction([
    ...parsed.data.habits.map((habit) =>
      db.habit.create({
        data: {
          userId: user.id,
          goalId: parsed.data.goalId,
          name: habit.name,
          description: habit.description ?? habit.reason,
          frequency: normalizeHabitFrequency(habit.frequency),
          reminderTime: normalizeReminderTime(habit.suggestedReminderTime),
          status: "active",
        },
      }),
    ),
    ...parsed.data.tasks.map((task) =>
      db.task.create({
        data: {
          userId: user.id,
          goalId: parsed.data.goalId,
          title: task.title,
          description: task.description ?? task.reason,
          priority: task.priority as Priority,
          dueDate: parseOptionalDateValue(task.dueDate),
          status: "todo",
        },
      }),
    ),
  ]);

  revalidateGoals(parsed.data.goalId);
  revalidatePath("/habits");
  revalidatePath("/tasks");
  return successState("Selected breakdown items saved.");
}

export async function generateHabitSuggestionsAction(
  _: GenerateHabitSuggestionsState,
  formData: FormData,
): Promise<GenerateHabitSuggestionsState> {
  const user = await requireCurrentUser();
  const goalId = idSchema.safeParse(readString(formData, "goalId"));

  if (!goalId.success) {
    return { ok: false, message: "Invalid goal.", suggestions: [] };
  }

  const goal = await db.goal.findFirst({
    where: {
      id: goalId.data,
      userId: user.id,
    },
    include: {
      lifeArea: {
        select: {
          name: true,
          type: true,
          vision: true,
        },
      },
    },
  });

  if (!goal) {
    return { ok: false, message: "Goal not found.", suggestions: [] };
  }

  const futureSelf = await db.futureSelf.findUnique({
    where: { userId: user.id },
    select: {
      title: true,
      identityStatement: true,
      description: true,
    },
  });

  const result = await generateHabitsFromGoal({
    title: goal.title,
    description: [
      goal.description ? `Goal description: ${goal.description}` : null,
      `Life area: ${goal.lifeArea.name} (${goal.lifeArea.type})`,
      goal.lifeArea.vision ? `Life area vision: ${goal.lifeArea.vision}` : null,
      futureSelf
        ? `Future self: ${futureSelf.title}. ${futureSelf.identityStatement}. ${futureSelf.description ?? ""}`
        : null,
    ]
      .filter(Boolean)
      .join("\n"),
    targetDate: goal.targetDate,
  });

  if (!result.ok) {
    return { ok: false, message: result.error, suggestions: [] };
  }

  return {
    ok: true,
    message: `Generated ${result.data.habits.length} habit suggestions.`,
    suggestions: result.data.habits.slice(0, 5).map((habit, index) => ({
      id: `${Date.now()}-${index}`,
      ...habit,
    })),
  };
}

export async function saveGeneratedHabitsAction(_: GoalActionState, formData: FormData): Promise<GoalActionState> {
  const user = await requireCurrentUser();
  const rawHabits = readString(formData, "habits");

  const parsed = saveGeneratedHabitsSchema.safeParse({
    goalId: readString(formData, "goalId"),
    habits: rawHabits ? parseJson(rawHabits) : [],
  });

  if (!parsed.success) {
    return errorState(parsed.error.issues[0]?.message ?? "Choose at least one valid habit suggestion.");
  }

  const goal = await db.goal.findFirst({
    where: {
      id: parsed.data.goalId,
      userId: user.id,
    },
    select: { id: true },
  });

  if (!goal) {
    return errorState("Goal not found.");
  }

  await db.habit.createMany({
    data: parsed.data.habits.map((habit) => ({
      userId: user.id,
      goalId: parsed.data.goalId,
      name: habit.name,
      description: habit.reason,
      frequency: normalizeHabitFrequency(habit.frequency),
      reminderTime: normalizeReminderTime(habit.suggestedReminderTime),
      status: "active",
    })),
  });

  revalidatePath(`/goals/${parsed.data.goalId}`);
  revalidatePath("/habits");
  revalidatePath("/dashboard");
  return successState("Selected habits saved.");
}

function parseGoalForm(formData: FormData) {
  const parsed = goalSchema.safeParse({
    lifeAreaId: readString(formData, "lifeAreaId"),
    title: readString(formData, "title"),
    description: readOptionalString(formData, "description"),
    status: readString(formData, "status"),
    priority: readString(formData, "priority"),
    targetDate: readOptionalDate(formData, "targetDate"),
    progress: readNumber(formData, "progress"),
  });

  if (!parsed.success) {
    return {
      success: false as const,
      message: parsed.error.issues[0]?.message ?? "Check the goal fields.",
    };
  }

  return {
    success: true as const,
    data: parsed.data,
  };
}

function revalidateGoals(goalId?: string) {
  revalidatePath("/goals");
  revalidatePath("/dashboard");

  if (goalId) {
    revalidatePath(`/goals/${goalId}`);
  }
}

function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function readOptionalString(formData: FormData, key: string) {
  const value = readString(formData, key);
  return value.length > 0 ? value : undefined;
}

function readOptionalDate(formData: FormData, key: string) {
  const value = readString(formData, key);
  return value.length > 0 ? value : undefined;
}

function readNumber(formData: FormData, key: string) {
  const value = Number(readString(formData, key));
  return Number.isFinite(value) ? value : 0;
}

function parseOptionalDateValue(value?: string) {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function parseJson(value: string) {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function normalizeHabitFrequency(value: string): HabitFrequency {
  const normalized = value.toLowerCase();

  if (normalized.includes("weekday")) {
    return "weekdays";
  }

  if (normalized.includes("week")) {
    return "weekly";
  }

  if (normalized.includes("month")) {
    return "monthly";
  }

  if (normalized.includes("daily") || normalized.includes("day")) {
    return "daily";
  }

  return "custom";
}

function normalizeReminderTime(value?: string) {
  if (!value) {
    return undefined;
  }

  const match = value.match(/\b([01]\d|2[0-3]):[0-5]\d\b/);
  return match?.[0];
}
