import { db } from "@lifeops/db";

export function getTodayDate() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export async function getAIPlannerContext(userId: string) {
  const today = getTodayDate();
  const tomorrow = addDays(today, 1);

  const [futureSelf, activeGoals, todayTasks, overdueTasks, activeHabits, existingPlan] = await Promise.all([
    db.futureSelf.findUnique({
      where: { userId },
      select: {
        title: true,
        identityStatement: true,
        description: true,
      },
    }),
    db.goal.findMany({
      where: {
        userId,
        status: "active",
      },
      select: {
        id: true,
        title: true,
        priority: true,
        progress: true,
      },
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
      take: 8,
    }),
    db.task.findMany({
      where: {
        userId,
        status: { not: "done" },
        dueDate: {
          gte: today,
          lt: tomorrow,
        },
      },
      select: {
        id: true,
        title: true,
        priority: true,
        dueDate: true,
      },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
      take: 10,
    }),
    db.task.findMany({
      where: {
        userId,
        status: { not: "done" },
        dueDate: {
          lt: today,
        },
      },
      select: {
        id: true,
        title: true,
        priority: true,
        dueDate: true,
      },
      orderBy: [{ dueDate: "asc" }, { priority: "desc" }],
      take: 10,
    }),
    db.habit.findMany({
      where: {
        userId,
        status: "active",
      },
      select: {
        id: true,
        name: true,
        streak: true,
      },
      orderBy: [{ reminderTime: "asc" }, { createdAt: "desc" }],
      take: 10,
    }),
    db.dailyPlan.findUnique({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
    }),
  ]);

  return {
    activeGoals,
    activeHabits,
    existingPlan,
    futureSelf,
    overdueTasks,
    today,
    todayTasks,
  };
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}
