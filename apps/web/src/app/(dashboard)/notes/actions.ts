"use server";

import { db } from "@lifeops/db";
import { ideaExpansionResponseSchema, idSchema, noteSummaryResponseSchema, noteSchema } from "@lifeops/shared";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { expandIdea, summarizeNote } from "@/server/services/ai-service";

export type NoteActionState = {
  ok: boolean;
  message: string;
};

export type NoteSummaryState = {
  ok: boolean;
  message: string;
  summary: z.infer<typeof noteSummaryResponseSchema> | null;
};

export type IdeaExpansionState = {
  ok: boolean;
  message: string;
  expansion: z.infer<typeof ideaExpansionResponseSchema> | null;
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

export async function summarizeNoteAction(_: NoteSummaryState, formData: FormData): Promise<NoteSummaryState> {
  const user = await requireCurrentUser();
  const noteId = idSchema.safeParse(readString(formData, "noteId"));

  if (!noteId.success) {
    return { ok: false, message: "Invalid note.", summary: null };
  }

  const note = await db.note.findFirst({
    where: { id: noteId.data, userId: user.id },
    select: { title: true, body: true, tags: true },
  });

  if (!note) {
    return { ok: false, message: "Note not found.", summary: null };
  }

  const result = await summarizeNote({
    title: note.title,
    body: note.body.slice(0, 6000),
    tags: note.tags,
  });

  if (!result.ok) {
    return { ok: false, message: result.error, summary: null };
  }

  return {
    ok: true,
    message: result.model === "fallback" ? "AI unavailable, so LifeOps prepared a starter summary." : "Note summary generated.",
    summary: result.data,
  };
}

export async function saveNoteSummaryAction(_: NoteActionState, formData: FormData): Promise<NoteActionState> {
  const user = await requireCurrentUser();
  const noteId = idSchema.safeParse(readString(formData, "noteId"));
  const summary = noteSummaryResponseSchema.safeParse(parseJson(readString(formData, "summary")));

  if (!noteId.success || !summary.success) {
    return errorState("Choose a valid generated summary.");
  }

  const result = await db.note.updateMany({
    where: { id: noteId.data, userId: user.id },
    data: { aiSummary: summary.data.summary },
  });

  if (result.count === 0) {
    return errorState("Note not found.");
  }

  revalidateNotes();
  return successState("Summary saved to note.");
}

export async function expandIdeaAction(_: IdeaExpansionState, formData: FormData): Promise<IdeaExpansionState> {
  const user = await requireCurrentUser();
  const idea = readString(formData, "idea");

  if (idea.length < 10) {
    return { ok: false, message: "Enter an idea with at least 10 characters.", expansion: null };
  }

  const [futureSelf, goals] = await Promise.all([
    db.futureSelf.findUnique({ where: { userId: user.id }, select: { title: true, identityStatement: true, description: true } }),
    db.goal.findMany({
      where: { userId: user.id, status: "active" },
      include: { lifeArea: { select: { name: true } } },
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
  ]);

  const result = await expandIdea({
    idea,
    futureSelf: futureSelf ? `${futureSelf.title}\n${futureSelf.identityStatement}\n${futureSelf.description ?? ""}` : null,
    activeGoals: goals.map((goal) => ({ title: goal.title, lifeArea: goal.lifeArea.name, progress: goal.progress })),
  });

  if (!result.ok) {
    return { ok: false, message: result.error, expansion: null };
  }

  return {
    ok: true,
    message: result.model === "fallback" ? "AI unavailable, so LifeOps prepared a starter expansion." : "Idea expanded for review.",
    expansion: result.data,
  };
}

export async function saveExpandedIdeaAction(_: NoteActionState, formData: FormData): Promise<NoteActionState> {
  const user = await requireCurrentUser();
  const expansion = ideaExpansionResponseSchema.safeParse(parseJson(readString(formData, "expansion")));
  const saveTasks = readString(formData, "saveTasks") === "on";

  if (!expansion.success) {
    return errorState("Generated idea expansion is invalid.");
  }

  await db.$transaction(async (tx) => {
    await tx.note.create({
      data: {
        userId: user.id,
        title: expansion.data.title,
        body: [
          expansion.data.summary,
          "",
          `Why it matters: ${expansion.data.whyItMatters}`,
          "",
          "Questions:",
          ...expansion.data.questions.map((question) => `- ${question}`),
        ].join("\n"),
        tags: ["idea", "ai"],
        aiSummary: expansion.data.summary,
      },
    });

    if (saveTasks && expansion.data.nextSteps.length) {
      await tx.task.createMany({
        data: expansion.data.nextSteps.map((task) => ({
          userId: user.id,
          title: task.title,
          description: task.description ?? task.reason,
          priority: task.priority,
          status: "todo",
          dueDate: parseOptionalDateValue(task.dueDate),
        })),
      });
    }
  });

  revalidateNotes();
  revalidatePath("/tasks");
  return successState("Expanded idea saved.");
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
