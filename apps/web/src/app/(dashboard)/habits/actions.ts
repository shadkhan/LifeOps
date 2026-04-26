"use server";

import { db, type HabitFrequency, type HabitStatus } from "@lifeops/db";
import { generatedHabitSchema, habitLogSchema, habitSchema, idSchema } from "@lifeops/shared";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { getTodayDate, recalculateHabitStreak } from "@/lib/db/habits";
import { suggestHabitsFromContext } from "@/server/services/ai-service";

export type HabitActionState = {
  ok: boolean;
  message: string;
};

export type HabitSuggestionState = {
  ok: boolean;
  message: string;
  suggestions: Array<z.infer<typeof generatedHabitSchema>>;
};

const saveHabitSuggestionsSchema = z.object({
  goalId: idSchema.optional(),
  habits: z.array(generatedHabitSchema).min(1).max(10),
});

const errorState = (message: string): HabitActionState => ({ ok: false, message });
const successState = (message: string): HabitActionState => ({ ok: true, message });

export async function createHabitAction(_: HabitActionState, formData: FormData): Promise<HabitActionState> {
  const user = await requireCurrentUser();
  const parsed = await parseHabitForm(user.id, formData);

  if (!parsed.success) {
    return errorState(parsed.message);
  }

  await db.habit.create({
    data: {
      userId: user.id,
      goalId: parsed.data.goalId,
      name: parsed.data.name,
      description: parsed.data.description,
      frequency: parsed.data.frequency as HabitFrequency,
      customFrequency: parsed.data.customFrequency,
      reminderTime: parsed.data.reminderTime,
      status: parsed.data.status as HabitStatus,
    },
  });

  revalidateHabits();
  return successState("Habit created.");
}

export async function updateHabitAction(_: HabitActionState, formData: FormData): Promise<HabitActionState> {
  const user = await requireCurrentUser();
  const habitId = idSchema.safeParse(readString(formData, "habitId"));

  if (!habitId.success) {
    return errorState("Invalid habit.");
  }

  const parsed = await parseHabitForm(user.id, formData);

  if (!parsed.success) {
    return errorState(parsed.message);
  }

  const result = await db.habit.updateMany({
    where: {
      id: habitId.data,
      userId: user.id,
    },
    data: {
      goalId: parsed.data.goalId,
      name: parsed.data.name,
      description: parsed.data.description,
      frequency: parsed.data.frequency as HabitFrequency,
      customFrequency: parsed.data.customFrequency,
      reminderTime: parsed.data.reminderTime,
      status: parsed.data.status as HabitStatus,
    },
  });

  if (result.count === 0) {
    return errorState("Habit not found.");
  }

  revalidateHabits();
  return successState("Habit updated.");
}

export async function deleteHabitAction(formData: FormData) {
  const user = await requireCurrentUser();
  const habitId = idSchema.safeParse(readString(formData, "habitId"));

  if (!habitId.success) {
    return;
  }

  await db.habit.deleteMany({
    where: {
      id: habitId.data,
      userId: user.id,
    },
  });

  revalidateHabits();
}

export async function suggestHabitsAction(_: HabitSuggestionState, _formData: FormData): Promise<HabitSuggestionState> {
  const user = await requireCurrentUser();
  const [futureSelf, goals, habits, notes] = await Promise.all([
    db.futureSelf.findUnique({ where: { userId: user.id }, select: { title: true, identityStatement: true, description: true } }),
    db.goal.findMany({
      where: { userId: user.id, status: "active" },
      include: { lifeArea: { select: { name: true } } },
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
      take: 8,
    }),
    db.habit.findMany({
      where: { userId: user.id },
      include: { goal: { select: { title: true } } },
      orderBy: { updatedAt: "desc" },
      take: 12,
    }),
    db.note.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" }, take: 5 }),
  ]);

  const result = await suggestHabitsFromContext({
    futureSelf: futureSelf ? `${futureSelf.title}\n${futureSelf.identityStatement}\n${futureSelf.description ?? ""}` : null,
    goals: goals.map((goal) => ({
      id: goal.id,
      title: goal.title,
      lifeArea: goal.lifeArea.name,
      priority: goal.priority,
      progress: goal.progress,
    })),
    currentHabits: habits.map((habit) => ({
      name: habit.name,
      frequency: habit.frequency,
      goal: habit.goal?.title,
      streak: habit.streak,
    })),
    recentNotes: notes.map((note) => ({ title: note.title, body: note.body.slice(0, 800) })),
  });

  if (!result.ok) {
    return { ok: false, message: result.error, suggestions: [] };
  }

  return {
    ok: true,
    message: result.model === "fallback" ? "AI unavailable, so LifeOps prepared starter habit ideas." : "Habit ideas generated.",
    suggestions: result.data.habits,
  };
}

export async function saveHabitSuggestionsAction(_: HabitActionState, formData: FormData): Promise<HabitActionState> {
  const user = await requireCurrentUser();
  const parsed = saveHabitSuggestionsSchema.safeParse({
    goalId: readOptionalString(formData, "goalId"),
    habits: parseJson(readString(formData, "habits")) ?? [],
  });

  if (!parsed.success) {
    return errorState(parsed.error.issues[0]?.message ?? "Choose at least one valid habit suggestion.");
  }

  if (parsed.data.goalId) {
    const goal = await db.goal.findFirst({ where: { id: parsed.data.goalId, userId: user.id }, select: { id: true } });
    if (!goal) {
      return errorState("Choose a valid linked goal.");
    }
  }

  await db.habit.createMany({
    data: parsed.data.habits.map((habit) => ({
      userId: user.id,
      goalId: parsed.data.goalId,
      name: habit.name,
      description: habit.description ?? habit.reason,
      frequency: normalizeHabitFrequency(habit.frequency),
      reminderTime: normalizeReminderTime(habit.suggestedReminderTime),
      status: "active" as HabitStatus,
    })),
  });

  revalidateHabits();
  return successState("Selected habits saved.");
}

export async function completeHabitTodayAction(formData: FormData) {
  await logHabitToday(formData, true);
}

export async function missHabitTodayAction(formData: FormData) {
  await logHabitToday(formData, false);
}

async function logHabitToday(formData: FormData, completed: boolean) {
  const user = await requireCurrentUser();
  const habitId = idSchema.safeParse(readString(formData, "habitId"));

  if (!habitId.success) {
    return;
  }

  const habit = await db.habit.findFirst({
    where: {
      id: habitId.data,
      userId: user.id,
    },
    select: { id: true },
  });

  if (!habit) {
    return;
  }

  const parsed = habitLogSchema.safeParse({
    habitId: habitId.data,
    date: getTodayDate(),
    completed,
    note: readOptionalString(formData, "reflection"),
  });

  if (!parsed.success) {
    return;
  }

  await db.habitLog.upsert({
    where: {
      habitId_date: {
        habitId: habitId.data,
        date: parsed.data.date,
      },
    },
    update: {
      completed: parsed.data.completed,
      note: parsed.data.note,
    },
    create: {
      userId: user.id,
      habitId: parsed.data.habitId,
      date: parsed.data.date,
      completed: parsed.data.completed,
      note: parsed.data.note,
    },
  });

  await recalculateHabitStreak(habitId.data, user.id);
  revalidateHabits();
}

async function parseHabitForm(userId: string, formData: FormData) {
  const goalId = readOptionalString(formData, "goalId");

  if (goalId) {
    const goal = await db.goal.findFirst({
      where: {
        id: goalId,
        userId,
      },
      select: { id: true },
    });

    if (!goal) {
      return {
        success: false as const,
        message: "Choose a valid linked goal.",
      };
    }
  }

  const parsed = habitSchema.safeParse({
    goalId,
    name: readString(formData, "name"),
    description: readOptionalString(formData, "description"),
    frequency: readString(formData, "frequency"),
    customFrequency: readOptionalString(formData, "customFrequency"),
    reminderTime: readOptionalString(formData, "reminderTime"),
    streak: readNumber(formData, "streak"),
    status: readString(formData, "isActive") === "on" ? "active" : "paused",
  });

  if (!parsed.success) {
    return {
      success: false as const,
      message: parsed.error.issues[0]?.message ?? "Check the habit fields.",
    };
  }

  return {
    success: true as const,
    data: parsed.data,
  };
}

function revalidateHabits() {
  revalidatePath("/habits");
  revalidatePath("/dashboard");
}

function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function readOptionalString(formData: FormData, key: string) {
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

function parseJson(value: string) {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}
