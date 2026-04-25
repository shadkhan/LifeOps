"use server";

import { db, type GoalStatus, type Priority } from "@lifeops/db";
import { goalSchema, goalStatusSchema, idSchema } from "@lifeops/shared";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCurrentUser } from "@/lib/auth/current-user";

export type GoalActionState = {
  ok: boolean;
  message: string;
};

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
