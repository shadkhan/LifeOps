"use server";

import { goalBreakdownResponseSchema, idSchema } from "@lifeops/shared";
import { z } from "zod";
import { db } from "@lifeops/db";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { breakDownGoal } from "@/server/services/ai-service";
import { actionError, aiActionResult, readString, type ActionResult } from "./_utils";

const inputSchema = z.object({
  goalId: idSchema,
});

export async function breakdownGoalAction(
  formData: FormData,
): Promise<ActionResult<z.infer<typeof goalBreakdownResponseSchema>>> {
  const user = await requireCurrentUser();
  const parsed = inputSchema.safeParse({
    goalId: readString(formData, "goalId"),
  });

  if (!parsed.success) {
    return actionError("Choose a valid goal.");
  }

  const goal = await db.goal.findFirst({
    where: {
      id: parsed.data.goalId,
      userId: user.id,
    },
    include: {
      lifeArea: { select: { name: true } },
      tasks: { select: { title: true, status: true }, take: 20 },
      habits: { select: { name: true, status: true, streak: true }, take: 20 },
    },
  });

  if (!goal) {
    return actionError("Goal not found.");
  }

  const result = await breakDownGoal({
    id: goal.id,
    title: goal.title,
    description: goal.description,
    lifeArea: goal.lifeArea.name,
    priority: goal.priority,
    progress: goal.progress,
    targetDate: goal.targetDate,
    tasks: goal.tasks,
    habits: goal.habits,
  });

  return aiActionResult(result, "Goal breakdown generated for review.");
}
