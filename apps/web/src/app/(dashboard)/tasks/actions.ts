"use server";

import { db, type Priority, type TaskStatus } from "@lifeops/db";
import { generatedTaskSchema, idSchema, taskSchema, taskStatusSchema } from "@lifeops/shared";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { createTasksFromSource } from "@/server/services/ai-service";

export type TaskActionState = {
  ok: boolean;
  message: string;
};

export type TaskSuggestionState = {
  ok: boolean;
  message: string;
  suggestions: Array<z.infer<typeof generatedTaskSchema>>;
};

const taskSuggestionSchema = z.object({
  goalId: idSchema.optional(),
  tasks: z.array(generatedTaskSchema).min(1).max(10),
});

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

export async function generateTasksFromIdeaAction(
  _: TaskSuggestionState,
  formData: FormData,
): Promise<TaskSuggestionState> {
  const idea = readString(formData, "idea");
  const sourceType = z.enum(["goal", "habit", "note", "idea"]).catch("idea").parse(readString(formData, "sourceType"));

  if (idea.length < 5) {
    return { ok: false, message: "Enter an idea or source text first.", suggestions: [] };
  }

  const result = await createTasksFromSource({
    sourceType,
    sourceTitle: idea.slice(0, 120),
    sourceBody: idea,
  });

  if (!result.ok) {
    return { ok: false, message: result.error, suggestions: [] };
  }

  return {
    ok: true,
    message: result.model === "fallback" ? "AI unavailable, so LifeOps prepared starter tasks." : "Task suggestions generated.",
    suggestions: result.data.tasks,
  };
}

export async function saveTaskSuggestionsAction(_: TaskActionState, formData: FormData): Promise<TaskActionState> {
  const user = await requireCurrentUser();
  const parsed = taskSuggestionSchema.safeParse({
    goalId: readOptionalString(formData, "goalId"),
    tasks: parseJson(readString(formData, "tasks")) ?? [],
  });

  if (!parsed.success) {
    return errorState(parsed.error.issues[0]?.message ?? "Choose at least one valid task suggestion.");
  }

  if (parsed.data.goalId) {
    const goal = await db.goal.findFirst({ where: { id: parsed.data.goalId, userId: user.id }, select: { id: true } });
    if (!goal) {
      return errorState("Choose a valid linked goal.");
    }
  }

  await db.task.createMany({
    data: parsed.data.tasks.map((task) => ({
      userId: user.id,
      goalId: parsed.data.goalId,
      title: task.title,
      description: task.description ?? task.reason,
      priority: task.priority as Priority,
      dueDate: parseOptionalDateValue(task.dueDate),
      status: "todo" as TaskStatus,
    })),
  });

  revalidateTasks();
  return successState("Selected tasks saved.");
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
