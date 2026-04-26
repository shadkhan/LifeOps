"use server";

import { ideaExpansionResponseSchema } from "@lifeops/shared";
import { z } from "zod";
import { db } from "@lifeops/db";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { expandIdea } from "@/server/services/ai-service";
import { actionError, aiActionResult, readString, type ActionResult } from "./_utils";

const inputSchema = z.object({
  idea: z.string().min(10, "Enter an idea with at least 10 characters.").max(5000),
});

export async function expandIdeaAction(formData: FormData): Promise<ActionResult<z.infer<typeof ideaExpansionResponseSchema>>> {
  const user = await requireCurrentUser();
  const parsed = inputSchema.safeParse({
    idea: readString(formData, "idea"),
  });

  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Check the idea.");
  }

  const [futureSelf, activeGoals] = await Promise.all([
    db.futureSelf.findUnique({
      where: { userId: user.id },
      select: { title: true, identityStatement: true, description: true },
    }),
    db.goal.findMany({
      where: { userId: user.id, status: "active" },
      include: { lifeArea: { select: { name: true } } },
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
  ]);

  const result = await expandIdea({
    idea: parsed.data.idea,
    futureSelf: futureSelf ? `${futureSelf.title}\n${futureSelf.identityStatement}\n${futureSelf.description ?? ""}` : null,
    activeGoals: activeGoals.map((goal) => ({
      title: goal.title,
      lifeArea: goal.lifeArea.name,
      progress: goal.progress,
    })),
  });

  return aiActionResult(result, "Idea expanded for review.");
}
