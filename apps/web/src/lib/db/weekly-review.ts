import { db } from "@lifeops/db";

export function getCurrentWeekStart() {
  return getWeekStart(new Date());
}

export function getWeekStart(date: Date) {
  const start = new Date(date);
  const day = start.getDay();
  const daysFromMonday = day === 0 ? 6 : day - 1;
  start.setDate(start.getDate() - daysFromMonday);
  start.setHours(0, 0, 0, 0);
  return start;
}

export function getWeekEnd(weekStart: Date) {
  return addDays(weekStart, 7);
}

export function parseWeekStart(value?: string) {
  if (!value) {
    return getCurrentWeekStart();
  }

  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return getCurrentWeekStart();
  }

  return getWeekStart(parsed);
}

export async function getWeeklyReviewContext(userId: string, weekStart: Date) {
  const weekEnd = getWeekEnd(weekStart);

  const [completedTasks, incompleteTasks, habitLogs, goals, notes, existingReview] = await Promise.all([
    db.task.findMany({
      where: {
        userId,
        status: "done",
        updatedAt: {
          gte: weekStart,
          lt: weekEnd,
        },
      },
      select: {
        id: true,
        title: true,
        priority: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 40,
    }),
    db.task.findMany({
      where: {
        userId,
        status: { not: "done" },
        OR: [
          {
            dueDate: {
              gte: weekStart,
              lt: weekEnd,
            },
          },
          {
            updatedAt: {
              gte: weekStart,
              lt: weekEnd,
            },
          },
        ],
      },
      select: {
        id: true,
        title: true,
        status: true,
        dueDate: true,
      },
      orderBy: [{ dueDate: "asc" }, { priority: "desc" }],
      take: 40,
    }),
    db.habitLog.findMany({
      where: {
        userId,
        date: {
          gte: weekStart,
          lt: weekEnd,
        },
      },
      select: {
        id: true,
        completed: true,
        date: true,
        note: true,
        habit: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { date: "asc" },
      take: 80,
    }),
    db.goal.findMany({
      where: {
        userId,
        status: { not: "archived" },
      },
      select: {
        id: true,
        title: true,
        status: true,
        progress: true,
        priority: true,
        lifeArea: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
      take: 30,
    }),
    db.note.findMany({
      where: {
        userId,
        createdAt: {
          gte: weekStart,
          lt: weekEnd,
        },
      },
      select: {
        id: true,
        title: true,
        body: true,
        tags: true,
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    db.weeklyReview.findUnique({
      where: {
        userId_weekStart_weekEnd: {
          userId,
          weekStart,
          weekEnd,
        },
      },
    }),
  ]);

  return {
    completedTasks,
    existingReview,
    goals,
    habitLogs,
    incompleteTasks,
    notes,
    weekEnd,
    weekStart,
  };
}

export function formatDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}
