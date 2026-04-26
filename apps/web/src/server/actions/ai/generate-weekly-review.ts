"use server";

import { weeklyReviewResponseSchema } from "@lifeops/shared";
import { z } from "zod";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { formatDateInput, getWeeklyReviewContext, parseWeekStart } from "@/lib/db/weekly-review";
import { generateWeeklyReview } from "@/server/services/ai-service";
import { aiActionResult, readOptionalString, type ActionResult } from "./_utils";

const inputSchema = z.object({
  weekStart: z.string().optional(),
});

export async function generateWeeklyReviewAction(
  formData: FormData,
): Promise<ActionResult<z.infer<typeof weeklyReviewResponseSchema>>> {
  const user = await requireCurrentUser();
  const parsed = inputSchema.parse({
    weekStart: readOptionalString(formData, "weekStart"),
  });
  const context = await getWeeklyReviewContext(user.id, parseWeekStart(parsed.weekStart));

  const result = await generateWeeklyReview({
    weekStart: formatDateInput(context.weekStart),
    weekEnd: formatDateInput(context.weekEnd),
    goals: context.goals.map((goal) => ({
      title: `${goal.title} (${goal.lifeArea.name}, ${goal.priority})`,
      progress: goal.progress,
      status: goal.status,
    })),
    completedTasks: context.completedTasks.map((task) => ({
      title: task.title,
    })),
    incompleteTasks: context.incompleteTasks.map((task) => ({
      title: task.title,
      status: task.status,
      dueDate: task.dueDate ? formatDateInput(task.dueDate) : null,
    })),
    habitLogs: context.habitLogs.map((log) => ({
      habitName: log.habit.name,
      completed: log.completed,
      date: formatDateInput(log.date),
      reflection: log.note,
    })),
    notes: context.notes.map((note) => ({
      title: note.title,
      body: note.body.slice(0, 2000),
    })),
    dailyPlans: context.dailyPlans.map((plan) => ({
      date: formatDateInput(plan.date),
      priorities: plan.priorities,
      reflectionPrompt: plan.reflectionPrompt,
    })),
  });

  return aiActionResult(result, "Weekly review generated for review.");
}
