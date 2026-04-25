"use server";

import { db, type HabitFrequency, type HabitStatus } from "@lifeops/db";
import { habitLogSchema, habitSchema, idSchema } from "@lifeops/shared";
import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { getTodayDate, recalculateHabitStreak } from "@/lib/db/habits";

export type HabitActionState = {
  ok: boolean;
  message: string;
};

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
