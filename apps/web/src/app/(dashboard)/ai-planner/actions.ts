"use server";

import { dailyPlannerResponseSchema } from "@lifeops/shared";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@lifeops/db";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { getAIPlannerContext } from "@/lib/db/ai-planner";
import { planMyDay } from "@/server/services/ai-service";

export type GeneratedPlanState = {
  ok: boolean;
  message: string;
  plan: z.infer<typeof dailyPlannerResponseSchema> | null;
  provider?: string;
  model?: string;
  hasExistingPlan: boolean;
};

export type SavePlanState = {
  ok: boolean;
  message: string;
};

const initialErrorPlan: GeneratedPlanState = {
  ok: false,
  message: "",
  plan: null,
  hasExistingPlan: false,
};

export async function generateDailyPlanAction(): Promise<GeneratedPlanState> {
  const user = await requireCurrentUser();
  const context = await getAIPlannerContext(user.id);
  const result = await planMyDay({
    date: context.today.toISOString().slice(0, 10),
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
      dueDate: task.dueDate?.toISOString().slice(0, 10) ?? null,
    })),
    overdueTasks: context.overdueTasks.map((task) => ({
      id: task.id,
      title: task.title,
      priority: task.priority,
      dueDate: task.dueDate?.toISOString().slice(0, 10) ?? null,
    })),
    habits: context.activeHabits.map((habit) => ({
      id: habit.id,
      name: habit.name,
      streak: habit.streak,
    })),
  });

  if (!result.ok) {
    return {
      ...initialErrorPlan,
      message: result.error,
      provider: result.provider,
      model: result.model,
      hasExistingPlan: Boolean(context.existingPlan),
    };
  }

  return {
    ok: true,
    message: "Daily plan generated. Review it before saving.",
    plan: result.data,
    provider: result.provider,
    model: result.model,
    hasExistingPlan: Boolean(context.existingPlan),
  };
}

export async function saveDailyPlanAction(_: SavePlanState, formData: FormData): Promise<SavePlanState> {
  const user = await requireCurrentUser();
  const context = await getAIPlannerContext(user.id);
  const overwriteConfirmed = String(formData.get("overwriteConfirmed") ?? "") === "on";
  const rawPlan = String(formData.get("plan") ?? "");
  const provider = String(formData.get("provider") ?? "") || undefined;
  const model = String(formData.get("model") ?? "") || undefined;

  if (context.existingPlan && !overwriteConfirmed) {
    return {
      ok: false,
      message: "A plan already exists for today. Confirm overwrite before saving.",
    };
  }

  const parsed = dailyPlannerResponseSchema.safeParse(JSON.parse(rawPlan || "{}"));

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Generated plan is invalid.",
    };
  }

  await db.dailyPlan.upsert({
    where: {
      userId_date: {
        userId: user.id,
        date: context.today,
      },
    },
    update: {
      priorities: parsed.data.priorities,
      plan: {
        dailyFocus: parsed.data.dailyFocus,
        blocks: parsed.data.plan,
        habitsToComplete: parsed.data.habitsToComplete,
        improvementSuggestion: parsed.data.improvementSuggestion,
      },
      suggestedTasks: parsed.data.suggestedTasks,
      reflectionPrompt: parsed.data.reflectionPrompt,
      aiProvider: provider,
      aiModel: model,
    },
    create: {
      userId: user.id,
      date: context.today,
      priorities: parsed.data.priorities,
      plan: {
        dailyFocus: parsed.data.dailyFocus,
        blocks: parsed.data.plan,
        habitsToComplete: parsed.data.habitsToComplete,
        improvementSuggestion: parsed.data.improvementSuggestion,
      },
      suggestedTasks: parsed.data.suggestedTasks,
      reflectionPrompt: parsed.data.reflectionPrompt,
      aiProvider: provider,
      aiModel: model,
    },
  });

  revalidatePath("/ai-planner");
  revalidatePath("/dashboard");
  return { ok: true, message: "Daily plan saved." };
}
