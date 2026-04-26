"use server";

import { aiSourceTypeSchema, idSchema, taskCreationResponseSchema } from "@lifeops/shared";
import { z } from "zod";
import { db } from "@lifeops/db";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { createTasksFromSource } from "@/server/services/ai-service";
import { actionError, aiActionResult, readOptionalString, readString, type ActionResult } from "./_utils";

const inputSchema = z
  .object({
    sourceType: aiSourceTypeSchema,
    sourceId: idSchema.optional(),
    idea: z.string().max(5000).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.sourceType === "idea" && !value.idea) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter an idea before creating tasks.",
        path: ["idea"],
      });
    }

    if (value.sourceType !== "idea" && !value.sourceId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Choose a source record before creating tasks.",
        path: ["sourceId"],
      });
    }
  });

export async function createTasksAction(formData: FormData): Promise<ActionResult<z.infer<typeof taskCreationResponseSchema>>> {
  const user = await requireCurrentUser();
  const parsed = inputSchema.safeParse({
    sourceType: readString(formData, "sourceType"),
    sourceId: readOptionalString(formData, "sourceId"),
    idea: readOptionalString(formData, "idea"),
  });

  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Check the task source.");
  }

  const source = await getTaskSource(user.id, parsed.data);

  if (!source) {
    return actionError("Source not found.");
  }

  const result = await createTasksFromSource(source);
  return aiActionResult(result, "Task suggestions generated for review.");
}

async function getTaskSource(
  userId: string,
  input: z.infer<typeof inputSchema>,
): Promise<{
  sourceType: "goal" | "habit" | "note" | "idea";
  sourceTitle: string;
  sourceBody?: string | null;
  linkedGoalId?: string | null;
} | null> {
  if (input.sourceType === "idea") {
    return {
      sourceType: "idea",
      sourceTitle: input.idea?.slice(0, 120) ?? "Idea",
      sourceBody: input.idea,
    };
  }

  if (!input.sourceId) {
    return null;
  }

  if (input.sourceType === "goal") {
    const goal = await db.goal.findFirst({
      where: { id: input.sourceId, userId },
      select: { id: true, title: true, description: true },
    });

    return goal
      ? {
          sourceType: "goal",
          sourceTitle: goal.title,
          sourceBody: goal.description,
          linkedGoalId: goal.id,
        }
      : null;
  }

  if (input.sourceType === "habit") {
    const habit = await db.habit.findFirst({
      where: { id: input.sourceId, userId },
      select: { name: true, description: true, goalId: true },
    });

    return habit
      ? {
          sourceType: "habit",
          sourceTitle: habit.name,
          sourceBody: habit.description,
          linkedGoalId: habit.goalId,
        }
      : null;
  }

  const note = await db.note.findFirst({
    where: { id: input.sourceId, userId },
    select: { title: true, body: true, goalId: true },
  });

  return note
    ? {
        sourceType: "note",
        sourceTitle: note.title,
        sourceBody: note.body.slice(0, 4000),
        linkedGoalId: note.goalId,
      }
    : null;
}
