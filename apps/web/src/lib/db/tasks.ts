import { db, type TaskStatus } from "@lifeops/db";

export type TaskView = "today" | "upcoming" | "completed" | "overdue";

export type TaskFilters = {
  view: TaskView;
  goalId?: string;
  status?: TaskStatus | "all";
};

export function getTodayDate() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export async function getTasksForUser(userId: string, filters: TaskFilters) {
  const today = getTodayDate();
  const tomorrow = addDays(today, 1);

  return db.task.findMany({
    where: {
      userId,
      ...(filters.goalId && filters.goalId !== "all" ? { goalId: filters.goalId } : {}),
      ...(filters.status && filters.status !== "all" ? { status: filters.status } : {}),
      ...getViewWhere(filters.view, today, tomorrow),
    },
    include: {
      goal: {
        select: {
          id: true,
          title: true,
          lifeArea: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
  });
}

export async function getGoalOptionsForTasks(userId: string) {
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

function getViewWhere(view: TaskView, today: Date, tomorrow: Date) {
  if (view === "today") {
    return {
      status: { not: "done" as const },
      dueDate: {
        gte: today,
        lt: tomorrow,
      },
    };
  }

  if (view === "upcoming") {
    return {
      status: { not: "done" as const },
      OR: [{ dueDate: null }, { dueDate: { gte: tomorrow } }],
    };
  }

  if (view === "completed") {
    return {
      status: "done" as const,
    };
  }

  return {
    status: { not: "done" as const },
    dueDate: {
      lt: today,
    },
  };
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}
