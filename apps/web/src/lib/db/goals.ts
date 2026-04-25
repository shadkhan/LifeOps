import { db, type GoalStatus } from "@lifeops/db";

export type GoalFilters = {
  status?: GoalStatus | "all";
  lifeAreaId?: string;
};

export async function getGoalsForUser(userId: string, filters: GoalFilters = {}) {
  return db.goal.findMany({
    where: {
      userId,
      ...(filters.status && filters.status !== "all" ? { status: filters.status } : {}),
      ...(filters.lifeAreaId && filters.lifeAreaId !== "all" ? { lifeAreaId: filters.lifeAreaId } : {}),
    },
    include: {
      lifeArea: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
      _count: {
        select: {
          habits: true,
          tasks: true,
        },
      },
    },
    orderBy: [{ status: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
  });
}

export async function getGoalForUser(userId: string, goalId: string) {
  return db.goal.findFirst({
    where: {
      id: goalId,
      userId,
    },
    include: {
      lifeArea: {
        select: {
          id: true,
          name: true,
          type: true,
          vision: true,
        },
      },
      habits: {
        select: {
          id: true,
          name: true,
          status: true,
          frequency: true,
          streak: true,
        },
        orderBy: { createdAt: "desc" },
      },
      tasks: {
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function getLifeAreasForGoalForms(userId: string) {
  return db.lifeArea.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      type: true,
    },
    orderBy: { createdAt: "asc" },
  });
}
