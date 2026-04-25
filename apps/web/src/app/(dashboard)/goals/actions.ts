"use server";

import { db, type GoalStatus, type HabitFrequency, type Priority } from "@lifeops/db";
import { generatedHabitSchema, goalSchema, goalStatusSchema, idSchema } from "@lifeops/shared";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { generateHabitsFromGoal } from "@/server/services/ai-service";

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

const saveGeneratedHabitsSchema = z.object({
  goalId: idSchema,
  habits: z.array(generatedHabitSchema).min(1).max(10),
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
    habits: rawHabits ? JSON.parse(rawHabits) : [],
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
