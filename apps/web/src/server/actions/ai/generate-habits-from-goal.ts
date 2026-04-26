"use server";

import { habitGenerationResponseSchema, idSchema } from "@lifeops/shared";
import { z } from "zod";
import { db } from "@lifeops/db";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { generateHabitsFromGoal } from "@/server/services/ai-service";
import { actionError, aiActionResult, readString, type ActionResult } from "./_utils";

const inputSchema = z.object({
  goalId: idSchema,
});

export async function generateHabitsFromGoalAction(
  formData: FormData,
): Promise<ActionResult<z.infer<typeof habitGenerationResponseSchema>>> {
  const user = await requireCurrentUser();
  const parsed = inputSchema.safeParse({
    goalId: readString(formData, "goalId"),
  });

  if (!parsed.success) {
    return actionError("Choose a valid goal.");
  }

  const [goal, futureSelf] = await Promise.all([
    db.goal.findFirst({
      where: {
        id: parsed.data.goalId,
        userId: user.id,
      },
      include: {
        lifeArea: {
          select: {
            name: true,
            type: true,
            vision: true,
          },
        },
      },
    }),
    db.futureSelf.findUnique({
      where: { userId: user.id },
      select: {
        title: true,
        identityStatement: true,
        description: true,
      },
    }),
  ]);

  if (!goal) {
    return actionError("Goal not found.");
  }

  const result = await generateHabitsFromGoal({
    title: goal.title,
    description: [
      goal.description ? `Goal description: ${goal.description}` : null,
      `Life area: ${goal.lifeArea.name} (${goal.lifeArea.type})`,
      goal.lifeArea.vision ? `Life area vision: ${goal.lifeArea.vision}` : null,
      futureSelf ? `Future self: ${futureSelf.title}. ${futureSelf.identityStatement}. ${futureSelf.description ?? ""}` : null,
    ]
      .filter(Boolean)
      .join("\n"),
    targetDate: goal.targetDate,
  });

  return aiActionResult(result, "Habit suggestions generated for review.");
}
