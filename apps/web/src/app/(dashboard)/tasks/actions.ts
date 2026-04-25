"use server";

import { db, type Priority, type TaskStatus } from "@lifeops/db";
import { idSchema, taskSchema, taskStatusSchema } from "@lifeops/shared";
import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@/lib/auth/current-user";

export type TaskActionState = {
  ok: boolean;
  message: string;
};

const errorState = (message: string): TaskActionState => ({ ok: false, message });
const successState = (message: string): TaskActionState => ({ ok: true, message });

export async function createTaskAction(_: TaskActionState, formData: FormData): Promise<TaskActionState> {
  const user = await requireCurrentUser();
  const parsed = await parseTaskForm(user.id, formData);

  if (!parsed.success) {
    return errorState(parsed.message);
  }

  await db.task.create({
    data: {
      userId: user.id,
      goalId: parsed.data.goalId,
      title: parsed.data.title,
      description: parsed.data.description,
      dueDate: parsed.data.dueDate,
      priority: parsed.data.priority as Priority,
      status: parsed.data.status as TaskStatus,
    },
  });

  revalidateTasks();
  return successState("Task created.");
}

export async function updateTaskAction(_: TaskActionState, formData: FormData): Promise<TaskActionState> {
  const user = await requireCurrentUser();
  const taskId = idSchema.safeParse(readString(formData, "taskId"));

  if (!taskId.success) {
    return errorState("Invalid task.");
  }

  const parsed = await parseTaskForm(user.id, formData);

  if (!parsed.success) {
    return errorState(parsed.message);
  }

  const result = await db.task.updateMany({
    where: {
      id: taskId.data,
      userId: user.id,
    },
    data: {
      goalId: parsed.data.goalId,
      title: parsed.data.title,
      description: parsed.data.description,
      dueDate: parsed.data.dueDate,
      priority: parsed.data.priority as Priority,
      status: parsed.data.status as TaskStatus,
    },
  });

  if (result.count === 0) {
    return errorState("Task not found.");
  }

  revalidateTasks();
  return successState("Task updated.");
}

export async function completeTaskAction(formData: FormData) {
  const user = await requireCurrentUser();
  const taskId = idSchema.safeParse(readString(formData, "taskId"));

  if (!taskId.success) {
    return;
  }

  await db.task.updateMany({
    where: {
      id: taskId.data,
      userId: user.id,
    },
    data: {
      status: "done",
    },
  });

  revalidateTasks();
}

export async function deleteTaskAction(formData: FormData) {
  const user = await requireCurrentUser();
  const taskId = idSchema.safeParse(readString(formData, "taskId"));

  if (!taskId.success) {
    return;
  }

  await db.task.deleteMany({
    where: {
      id: taskId.data,
      userId: user.id,
    },
  });

  revalidateTasks();
}

async function parseTaskForm(userId: string, formData: FormData) {
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

  const parsed = taskSchema.safeParse({
    goalId,
    title: readString(formData, "title"),
    description: readOptionalString(formData, "description"),
    dueDate: readOptionalDate(formData, "dueDate"),
    priority: readString(formData, "priority"),
    status: readString(formData, "status"),
  });

  if (!parsed.success) {
    return {
      success: false as const,
      message: parsed.error.issues[0]?.message ?? "Check the task fields.",
    };
  }

  const status = taskStatusSchema.safeParse(parsed.data.status);

  if (!status.success) {
    return {
      success: false as const,
      message: "Choose a valid status.",
    };
  }

  return {
    success: true as const,
    data: parsed.data,
  };
}

function revalidateTasks() {
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
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
