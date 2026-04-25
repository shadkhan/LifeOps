import { db } from "@lifeops/db";

export type NotesView = "all" | "recent" | "linked";

export type NoteFilters = {
  query?: string;
  view: NotesView;
};

export async function getNotesForUser(userId: string, filters: NoteFilters) {
  const query = filters.query?.trim();

  return db.note.findMany({
    where: {
      userId,
      ...(filters.view === "linked"
        ? {
            OR: [
              { goalId: { not: null } },
              { habitId: { not: null } },
              { taskId: { not: null } },
              { lifeAreaId: { not: null } },
            ],
          }
        : {}),
      ...(query
        ? {
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { body: { contains: query, mode: "insensitive" } },
              { tags: { has: query.toLowerCase() } },
            ],
          }
        : {}),
    },
    include: {
      goal: {
        select: {
          id: true,
          title: true,
        },
      },
      habit: {
        select: {
          id: true,
          name: true,
        },
      },
      task: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: filters.view === "recent" ? 12 : undefined,
  });
}

export async function getNoteLinkOptions(userId: string) {
  const [goals, habits, tasks] = await Promise.all([
    db.goal.findMany({
      where: {
        userId,
        status: { not: "archived" },
      },
      select: {
        id: true,
        title: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    db.habit.findMany({
      where: {
        userId,
        status: { not: "archived" },
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    db.task.findMany({
      where: {
        userId,
        status: { not: "archived" },
      },
      select: {
        id: true,
        title: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return { goals, habits, tasks };
}
