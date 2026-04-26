"use server";

import { dailyPlannerResponseSchema } from "@lifeops/shared";
import { z } from "zod";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { getAIPlannerContext } from "@/lib/db/ai-planner";
import { planMyDay } from "@/server/services/ai-service";
import { aiActionResult, formatDateInput, type ActionResult } from "./_utils";

export async function planDayAction(): Promise<ActionResult<z.infer<typeof dailyPlannerResponseSchema>>> {
  const user = await requireCurrentUser();
  const context = await getAIPlannerContext(user.id);

  const result = await planMyDay({
    date: formatDateInput(context.today),
    futureSelf: context.futureSelf
      ? `${context.futureSelf.title}: ${context.futureSelf.identityStatement}. ${context.futureSelf.description ?? ""}`
      : null,
    goals: context.activeGoals.map((goal) => ({
      id: goal.id,
      title: goal.title,
      priority: goal.priority,
      progress: goal.progress,
    })),
    tasks: context.todayTasks.map((task) => ({
      id: task.id,
      title: task.title,
      priority: task.priority,
      dueDate: task.dueDate ? formatDateInput(task.dueDate) : null,
    })),
    overdueTasks: context.overdueTasks.map((task) => ({
      id: task.id,
      title: task.title,
      priority: task.priority,
      dueDate: task.dueDate ? formatDateInput(task.dueDate) : null,
    })),
    habits: context.activeHabits.map((habit) => ({
      id: habit.id,
      name: habit.name,
      streak: habit.streak,
    })),
  });

  return aiActionResult(result, "Daily plan generated for review.");
}
