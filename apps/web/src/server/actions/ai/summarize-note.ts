"use server";

import { idSchema, noteSummaryResponseSchema } from "@lifeops/shared";
import { z } from "zod";
import { db } from "@lifeops/db";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { summarizeNote } from "@/server/services/ai-service";
import { actionError, aiActionResult, readString, type ActionResult } from "./_utils";

const inputSchema = z.object({
  noteId: idSchema,
});

export async function summarizeNoteAction(
  formData: FormData,
): Promise<ActionResult<z.infer<typeof noteSummaryResponseSchema>>> {
  const user = await requireCurrentUser();
  const parsed = inputSchema.safeParse({
    noteId: readString(formData, "noteId"),
  });

  if (!parsed.success) {
    return actionError("Choose a valid note.");
  }

  const note = await db.note.findFirst({
    where: {
      id: parsed.data.noteId,
      userId: user.id,
    },
    select: {
      title: true,
      body: true,
      tags: true,
    },
  });

  if (!note) {
    return actionError("Note not found.");
  }

  const result = await summarizeNote({
    title: note.title,
    body: note.body.slice(0, 6000),
    tags: note.tags,
  });

  return aiActionResult(result, "Note summary generated for review.");
}
