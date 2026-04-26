"use server";

import { goalsFromFutureSelfResponseSchema } from "@lifeops/shared";
import { z } from "zod";
import { db } from "@lifeops/db";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { generateGoalsFromFutureSelf } from "@/server/services/ai-service";
import { actionError, aiActionResult, type ActionResult } from "./_utils";

export async function generateGoalsFromFutureSelfAction(): Promise<
  ActionResult<z.infer<typeof goalsFromFutureSelfResponseSchema>>
> {
  const user = await requireCurrentUser();
  const futureSelf = await db.futureSelf.findUnique({
    where: { userId: user.id },
    include: {
      lifeAreas: {
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
          type: true,
          vision: true,
          gap: true,
        },
      },
    },
  });

  if (!futureSelf || futureSelf.lifeAreas.length === 0) {
    return actionError("Create a Future Self and at least one life area before generating goals.");
  }

  const existingGoals = await db.goal.findMany({
    where: { userId: user.id },
    select: {
      title: true,
      status: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 30,
  });

  const result = await generateGoalsFromFutureSelf({
    futureSelf: `${futureSelf.title}\n${futureSelf.identityStatement}\n${futureSelf.description ?? ""}`,
    lifeAreas: futureSelf.lifeAreas.map((area) => ({
      id: area.id,
      name: area.name,
      type: area.type,
      vision: area.vision,
      gap: area.gap,
    })),
    existingGoals,
  });

  return aiActionResult(result, "Goal suggestions generated for review.");
}
