"use server";

import { weeklyReviewResponseSchema } from "@lifeops/shared";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@lifeops/db";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { formatDateInput, getWeeklyReviewContext, parseWeekStart } from "@/lib/db/weekly-review";
import { generateWeeklyReview } from "@/server/services/ai-service";

export type GeneratedWeeklyReviewState = {
  ok: boolean;
  message: string;
  review: z.infer<typeof weeklyReviewResponseSchema> | null;
  provider?: string;
  model?: string;
};

export type SaveWeeklyReviewState = {
  ok: boolean;
  message: string;
};

export async function generateWeeklyReviewAction(formData: FormData): Promise<GeneratedWeeklyReviewState> {
  const user = await requireCurrentUser();
  const weekStart = parseWeekStart(String(formData.get("weekStart") ?? ""));
  const context = await getWeeklyReviewContext(user.id, weekStart);

  const result = await generateWeeklyReview({
    weekStart: formatDateInput(context.weekStart),
    weekEnd: formatDateInput(context.weekEnd),
    goals: context.goals.map((goal) => ({
      title: `${goal.title} (${goal.lifeArea.name}, ${goal.priority})`,
      progress: goal.progress,
      status: goal.status,
    })),
    completedTasks: context.completedTasks.map((task) => ({ title: task.title })),
    incompleteTasks: context.incompleteTasks.map((task) => ({
      title: task.title,
      status: task.status,
      dueDate: task.dueDate?.toISOString().slice(0, 10) ?? null,
    })),
    habitLogs: context.habitLogs.map((log) => ({
      habitName: log.habit.name,
      completed: log.completed,
      date: log.date.toISOString().slice(0, 10),
      reflection: log.note,
    })),
    notes: context.notes.map((note) => ({
      title: note.title,
      body: note.body.slice(0, 2000),
    })),
  });

  if (!result.ok) {
    return {
      ok: false,
      message: result.error,
      review: null,
      provider: result.provider,
      model: result.model,
    };
  }

  return {
    ok: true,
    message: "Weekly review generated. Review it before saving.",
    review: result.data,
    provider: result.provider,
    model: result.model,
  };
}

export async function saveWeeklyReviewAction(
  _: SaveWeeklyReviewState,
  formData: FormData,
): Promise<SaveWeeklyReviewState> {
  const user = await requireCurrentUser();
  const weekStart = parseWeekStart(String(formData.get("weekStart") ?? ""));
  const weekEnd = new Date(String(formData.get("weekEnd") ?? ""));
  const rawReview = String(formData.get("review") ?? "");
  const provider = String(formData.get("provider") ?? "") || undefined;
  const model = String(formData.get("model") ?? "") || undefined;
  const parsed = weeklyReviewResponseSchema.safeParse(JSON.parse(rawReview || "{}"));

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Generated review is invalid.",
    };
  }

  const safeWeekEnd = Number.isNaN(weekEnd.getTime()) ? new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000) : weekEnd;

  await db.weeklyReview.upsert({
    where: {
      userId_weekStart_weekEnd: {
        userId: user.id,
        weekStart,
        weekEnd: safeWeekEnd,
      },
    },
    update: {
      summary: parsed.data.summary,
      wins: parsed.data.wins,
      gaps: parsed.data.gaps,
      habitInsights: parsed.data.habitInsights,
      goalProgress: parsed.data.goalProgress,
      nextWeekSuggestions: parsed.data.nextWeekSuggestions,
      aiContent: {
        patterns: parsed.data.patterns,
      },
      aiProvider: provider,
      aiModel: model,
    },
    create: {
      userId: user.id,
      weekStart,
      weekEnd: safeWeekEnd,
      summary: parsed.data.summary,
      wins: parsed.data.wins,
      gaps: parsed.data.gaps,
      habitInsights: parsed.data.habitInsights,
      goalProgress: parsed.data.goalProgress,
      nextWeekSuggestions: parsed.data.nextWeekSuggestions,
      aiContent: {
        patterns: parsed.data.patterns,
      },
      aiProvider: provider,
      aiModel: model,
    },
  });

  revalidatePath("/weekly-review");
  revalidatePath("/dashboard");
  return { ok: true, message: "Weekly review saved." };
}
