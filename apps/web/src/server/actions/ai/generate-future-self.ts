"use server";

import {
  futureSelfGenerationResponseSchema,
  type FutureSelfGenerationResponse,
} from "@lifeops/shared";
import { z } from "zod";
import { db, type HabitFrequency, type LifeAreaType, type Priority } from "@lifeops/db";
import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { generateFutureSelfProfile } from "@/server/services/ai-service";
import { actionError, aiActionResult, readString, type ActionResult } from "./_utils";

const inputSchema = z.object({
  prompt: z.string().min(10, "Describe the future self you want in at least 10 characters.").max(5000),
});

const saveInputSchema = z.object({
  generated: futureSelfGenerationResponseSchema,
  selectedLifeAreas: z.array(z.number().int().min(0)).default([]),
  selectedGoals: z.array(z.number().int().min(0)).default([]),
  selectedHabits: z.array(z.number().int().min(0)).default([]),
});

export async function generateFutureSelfAction(
  formData: FormData,
): Promise<ActionResult<z.infer<typeof futureSelfGenerationResponseSchema>>> {
  const user = await requireCurrentUser();
  const parsed = inputSchema.safeParse({
    prompt: readString(formData, "prompt"),
  });

  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Check the future self prompt.");
  }

  const existingFutureSelf = await db.futureSelf.findUnique({
    where: { userId: user.id },
    select: {
      title: true,
      description: true,
      identityStatement: true,
    },
  });

  const result = await generateFutureSelfProfile({
    prompt: parsed.data.prompt,
    existingFutureSelf: existingFutureSelf
      ? `${existingFutureSelf.title}\n${existingFutureSelf.identityStatement}\n${existingFutureSelf.description ?? ""}`
      : null,
  });

  return aiActionResult(result, "Future self profile generated for review.");
}

export async function saveGeneratedFutureSelfAction(
  formData: FormData,
): Promise<ActionResult<{ futureSelfId: string; goalsCreated: number; habitsCreated: number }>> {
  const user = await requireCurrentUser();
  const parsed = saveInputSchema.safeParse({
    generated: parseJson(readString(formData, "generated")),
    selectedLifeAreas: parseJson(readString(formData, "selectedLifeAreas")) ?? [],
    selectedGoals: parseJson(readString(formData, "selectedGoals")) ?? [],
    selectedHabits: parseJson(readString(formData, "selectedHabits")) ?? [],
  });

  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Generated Future Self data is invalid.");
  }

  const { generated, selectedGoals, selectedHabits, selectedLifeAreas } = parsed.data;

  const result = await db.$transaction(async (tx) => {
    const futureSelf = await tx.futureSelf.upsert({
      where: { userId: user.id },
      update: {
        title: generated.title,
        description: generated.description,
        identityStatement: generated.identityStatement,
      },
      create: {
        userId: user.id,
        title: generated.title,
        description: generated.description,
        identityStatement: generated.identityStatement,
      },
    });

    const lifeAreaByName = new Map<string, string>();
    const existingLifeAreas = await tx.lifeArea.findMany({
      where: { userId: user.id, deletedAt: null },
      select: { id: true, name: true },
    });

    existingLifeAreas.forEach((area) => {
      lifeAreaByName.set(normalizeKey(area.name), area.id);
    });

    const lifeAreaNamesNeeded = new Set<string>();
    selectedLifeAreas.forEach((index) => {
      const area = generated.lifeAreas[index];
      if (area) {
        lifeAreaNamesNeeded.add(area.name);
      }
    });
    selectedGoals.forEach((index) => {
      const goal = generated.suggestedGoals[index];
      if (goal) {
        lifeAreaNamesNeeded.add(goal.lifeAreaName);
      }
    });

    for (const name of lifeAreaNamesNeeded) {
      const area = findLifeArea(generated, name);
      if (!area) {
        continue;
      }

      const existingId = lifeAreaByName.get(normalizeKey(area.name));
      if (existingId) {
        await tx.lifeArea.update({
          where: { id: existingId },
          data: {
            futureSelfId: futureSelf.id,
            type: area.type as LifeAreaType,
            vision: area.vision,
            currentReality: area.currentReality,
            gap: area.gap,
            deletedAt: null,
          },
        });
        continue;
      }

      const created = await tx.lifeArea.create({
        data: {
          userId: user.id,
          futureSelfId: futureSelf.id,
          name: area.name,
          type: area.type as LifeAreaType,
          vision: area.vision,
          currentReality: area.currentReality,
          gap: area.gap,
        },
        select: { id: true, name: true },
      });
      lifeAreaByName.set(normalizeKey(created.name), created.id);
    }

    const goalByTitle = new Map<string, string>();
    const existingGoals = await tx.goal.findMany({
      where: { userId: user.id },
      select: { id: true, title: true },
    });
    existingGoals.forEach((goal) => goalByTitle.set(normalizeKey(goal.title), goal.id));

    let goalsCreated = 0;
    for (const index of selectedGoals) {
      const goal = generated.suggestedGoals[index];
      if (!goal) {
        continue;
      }

      const lifeArea = findLifeArea(generated, goal.lifeAreaName);
      const lifeAreaId =
        lifeAreaByName.get(normalizeKey(goal.lifeAreaName)) ??
        (lifeArea ? lifeAreaByName.get(normalizeKey(lifeArea.name)) : undefined);

      if (!lifeAreaId) {
        continue;
      }

      const created = await tx.goal.create({
        data: {
          userId: user.id,
          lifeAreaId,
          title: goal.title,
          description: `${goal.description}\n\nAI rationale: ${goal.reason}`,
          priority: goal.priority as Priority,
          targetDate: parseOptionalDate(goal.targetDate),
          status: "active",
          progress: 0,
        },
        select: { id: true, title: true },
      });
      goalsCreated += 1;
      goalByTitle.set(normalizeKey(created.title), created.id);
    }

    let habitsCreated = 0;
    for (const index of selectedHabits) {
      const habit = generated.suggestedHabits[index];
      if (!habit) {
        continue;
      }

      await tx.habit.create({
        data: {
          userId: user.id,
          goalId: habit.goalTitle ? goalByTitle.get(normalizeKey(habit.goalTitle)) : undefined,
          name: habit.name,
          description: habit.description ?? habit.reason,
          frequency: habit.frequency as HabitFrequency,
          reminderTime: normalizeReminderTime(habit.suggestedReminderTime),
          status: "active",
        },
      });
      habitsCreated += 1;
    }

    return {
      futureSelfId: futureSelf.id,
      goalsCreated,
      habitsCreated,
    };
  });

  revalidatePath("/future-self");
  revalidatePath("/goals");
  revalidatePath("/habits");
  revalidatePath("/dashboard");

  return {
    ok: true,
    message: "Reviewed Future Self profile saved.",
    data: result,
  };
}

function findLifeArea(generated: FutureSelfGenerationResponse, name: string) {
  return generated.lifeAreas.find((area) => normalizeKey(area.name) === normalizeKey(name)) ?? generated.lifeAreas[0];
}

function normalizeKey(value: string) {
  return value.trim().toLowerCase();
}

function parseOptionalDate(value?: string) {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function normalizeReminderTime(value?: string) {
  if (!value) {
    return undefined;
  }

  const match = value.match(/\b([01]\d|2[0-3]):[0-5]\d\b/);
  return match?.[0];
}

function parseJson(value: string) {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}
