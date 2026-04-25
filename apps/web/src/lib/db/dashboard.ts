import { db } from "@lifeops/db";

export async function getDashboardData(userId: string) {
  const today = getTodayDate();
  const tomorrow = addDays(today, 1);
  const weekStart = getWeekStart(today);
  const weekEnd = addDays(weekStart, 7);

  const [
    todayTasks,
    todayHabits,
    activeGoals,
    futureSelf,
    weeklyCompletedTasks,
    weeklyTotalTasks,
    weeklyHabitLogs,
    recentNotes,
  ] = await Promise.all([
    db.task.findMany({
      where: {
        userId,
        status: { not: "done" },
        dueDate: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        goal: {
          select: {
            title: true,
          },
        },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
      take: 6,
    }),
    db.habit.findMany({
      where: {
        userId,
        status: "active",
      },
      include: {
        goal: {
          select: {
            title: true,
          },
        },
        logs: {
          where: {
            date: today,
          },
          take: 1,
        },
      },
      orderBy: [{ reminderTime: "asc" }, { createdAt: "desc" }],
      take: 8,
    }),
    db.goal.findMany({
      where: {
        userId,
        status: "active",
      },
      include: {
        lifeArea: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
      take: 5,
    }),
    db.futureSelf.findUnique({
      where: { userId },
      select: {
        identityStatement: true,
        title: true,
      },
    }),
    db.task.count({
      where: {
        userId,
        status: "done",
        updatedAt: {
          gte: weekStart,
          lt: weekEnd,
        },
      },
    }),
    db.task.count({
      where: {
        userId,
        createdAt: {
          lt: weekEnd,
        },
        OR: [
          {
            updatedAt: {
              gte: weekStart,
              lt: weekEnd,
            },
          },
          {
            dueDate: {
              gte: weekStart,
              lt: weekEnd,
            },
          },
        ],
      },
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
        completed: true,
      },
    }),
    db.note.findMany({
      where: { userId },
      include: {
        goal: { select: { title: true } },
        habit: { select: { name: true } },
        task: { select: { title: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
  ]);

  const completedHabitLogs = weeklyHabitLogs.filter((log) => log.completed).length;
  const habitCompletionPercentage =
    weeklyHabitLogs.length > 0 ? Math.round((completedHabitLogs / weeklyHabitLogs.length) * 100) : 0;

  return {
    activeGoals,
    futureSelf,
    habitCompletionPercentage,
    recentNotes,
    today,
    todayHabits,
    todayTasks,
    weeklyCompletedTasks,
    weeklyHabitLogs: weeklyHabitLogs.length,
    weeklyTotalTasks,
  };
}

function getTodayDate() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function getWeekStart(date: Date) {
  const start = new Date(date);
  const day = start.getDay();
  const daysFromMonday = day === 0 ? 6 : day - 1;
  start.setDate(start.getDate() - daysFromMonday);
  start.setHours(0, 0, 0, 0);
  return start;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}
