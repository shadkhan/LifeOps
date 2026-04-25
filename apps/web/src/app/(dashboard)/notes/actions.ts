"use server";

import { db } from "@lifeops/db";
import { idSchema, noteSchema } from "@lifeops/shared";
import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@/lib/auth/current-user";

export type NoteActionState = {
  ok: boolean;
  message: string;
};

const errorState = (message: string): NoteActionState => ({ ok: false, message });
const successState = (message: string): NoteActionState => ({ ok: true, message });

export async function createNoteAction(_: NoteActionState, formData: FormData): Promise<NoteActionState> {
  const user = await requireCurrentUser();
  const parsed = await parseNoteForm(user.id, formData);

  if (!parsed.success) {
    return errorState(parsed.message);
  }

  await db.note.create({
    data: {
      userId: user.id,
      title: parsed.data.title,
      body: parsed.data.body,
      tags: parsed.data.tags,
      goalId: parsed.data.goalId,
      habitId: parsed.data.habitId,
      taskId: parsed.data.taskId,
      aiSummary: parsed.data.aiSummary,
    },
  });

  revalidateNotes();
  return successState("Note created.");
}

export async function updateNoteAction(_: NoteActionState, formData: FormData): Promise<NoteActionState> {
  const user = await requireCurrentUser();
  const noteId = idSchema.safeParse(readString(formData, "noteId"));

  if (!noteId.success) {
    return errorState("Invalid note.");
  }

  const parsed = await parseNoteForm(user.id, formData);

  if (!parsed.success) {
    return errorState(parsed.message);
  }

  const result = await db.note.updateMany({
    where: {
      id: noteId.data,
      userId: user.id,
    },
    data: {
      title: parsed.data.title,
      body: parsed.data.body,
      tags: parsed.data.tags,
      goalId: parsed.data.goalId,
      habitId: parsed.data.habitId,
      taskId: parsed.data.taskId,
      aiSummary: parsed.data.aiSummary,
    },
  });

  if (result.count === 0) {
    return errorState("Note not found.");
  }

  revalidateNotes();
  return successState("Note updated.");
}

export async function deleteNoteAction(formData: FormData) {
  const user = await requireCurrentUser();
  const noteId = idSchema.safeParse(readString(formData, "noteId"));

  if (!noteId.success) {
    return;
  }

  await db.note.deleteMany({
    where: {
      id: noteId.data,
      userId: user.id,
    },
  });

  revalidateNotes();
}

async function parseNoteForm(userId: string, formData: FormData) {
  const goalId = readOptionalString(formData, "goalId");
  const habitId = readOptionalString(formData, "habitId");
  const taskId = readOptionalString(formData, "taskId");

  const linkError = await validateLinks(userId, { goalId, habitId, taskId });
  if (linkError) {
    return {
      success: false as const,
      message: linkError,
    };
  }

  const parsed = noteSchema.safeParse({
    goalId,
    habitId,
    taskId,
    title: readString(formData, "title"),
    body: readString(formData, "body"),
    tags: parseTags(readString(formData, "tags")),
    aiSummary: readOptionalString(formData, "aiSummary"),
  });

  if (!parsed.success) {
    return {
      success: false as const,
      message: parsed.error.issues[0]?.message ?? "Check the note fields.",
    };
  }

  return {
    success: true as const,
    data: parsed.data,
  };
}

async function validateLinks(
  userId: string,
  links: {
    goalId?: string;
    habitId?: string;
    taskId?: string;
  },
) {
  const [goal, habit, task] = await Promise.all([
    links.goalId
      ? db.goal.findFirst({ where: { id: links.goalId, userId }, select: { id: true } })
      : Promise.resolve({ id: null }),
    links.habitId
      ? db.habit.findFirst({ where: { id: links.habitId, userId }, select: { id: true } })
      : Promise.resolve({ id: null }),
    links.taskId
      ? db.task.findFirst({ where: { id: links.taskId, userId }, select: { id: true } })
      : Promise.resolve({ id: null }),
  ]);

  if (links.goalId && !goal) {
    return "Choose a valid linked goal.";
  }

  if (links.habitId && !habit) {
    return "Choose a valid linked habit.";
  }

  if (links.taskId && !task) {
    return "Choose a valid linked task.";
  }

  return null;
}

function revalidateNotes() {
  revalidatePath("/notes");
  revalidatePath("/dashboard");
}

function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function readOptionalString(formData: FormData, key: string) {
  const value = readString(formData, key);
  return value.length > 0 ? value : undefined;
}

function parseTags(value: string) {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean),
    ),
  );
}
