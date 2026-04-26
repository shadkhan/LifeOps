"use server";

import { habitSuggestionResponseSchema } from "@lifeops/shared";
import { z } from "zod";
import { db } from "@lifeops/db";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { suggestHabitsFromContext } from "@/server/services/ai-service";
import { aiActionResult, type ActionResult } from "./_utils";

export async function suggestHabitsAction(): Promise<ActionResult<z.infer<typeof habitSuggestionResponseSchema>>> {
  const user = await requireCurrentUser();
  const [futureSelf, goals, habits, notes] = await Promise.all([
    db.futureSelf.findUnique({
      where: { userId: user.id },
      select: { title: true, identityStatement: true, description: true },
    }),
    db.goal.findMany({
      where: { userId: user.id, status: "active" },
      include: { lifeArea: { select: { name: true } } },
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
      take: 8,
    }),
    db.habit.findMany({
      where: { userId: user.id },
      include: { goal: { select: { title: true } } },
      orderBy: { updatedAt: "desc" },
      take: 12,
    }),
    db.note.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
  ]);

  const result = await suggestHabitsFromContext({
    futureSelf: futureSelf ? `${futureSelf.title}\n${futureSelf.identityStatement}\n${futureSelf.description ?? ""}` : null,
    goals: goals.map((goal) => ({
      id: goal.id,
      title: goal.title,
      lifeArea: goal.lifeArea.name,
      priority: goal.priority,
      progress: goal.progress,
    })),
    currentHabits: habits.map((habit) => ({
      name: habit.name,
      frequency: habit.frequency,
      goal: habit.goal?.title,
      streak: habit.streak,
    })),
    recentNotes: notes.map((note) => ({
      title: note.title,
      body: note.body.slice(0, 800),
    })),
  });

  return aiActionResult(result, "Habit suggestions generated for review.");
}
