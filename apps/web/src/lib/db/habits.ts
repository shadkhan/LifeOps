import { db } from "@lifeops/db";

export function getTodayDate() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export async function getHabitsForUser(userId: string) {
  const today = getTodayDate();

  return db.habit.findMany({
    where: { userId },
    include: {
      goal: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
      logs: {
        where: {
          date: {
            lte: today,
          },
        },
        orderBy: { date: "desc" },
        take: 7,
      },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
}

export async function getGoalOptionsForHabits(userId: string) {
  return db.goal.findMany({
    where: {
      userId,
      status: {
        not: "archived",
      },
    },
    select: {
      id: true,
      title: true,
      lifeArea: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function recalculateHabitStreak(habitId: string, userId: string) {
  const logs = await db.habitLog.findMany({
    where: {
      habitId,
      userId,
      completed: true,
    },
    select: { date: true },
    orderBy: { date: "desc" },
    take: 90,
  });

  const completedDates = new Set(logs.map((log) => toDateKey(log.date)));
  let cursor = getTodayDate();
  let streak = 0;

  while (completedDates.has(toDateKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  await db.habit.updateMany({
    where: {
      id: habitId,
      userId,
    },
    data: { streak },
  });

  return streak;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}
