import { db } from "@lifeops/db";

export async function getFutureSelfForUser(userId: string) {
  return db.futureSelf.findUnique({
    where: { userId },
    include: {
      lifeAreas: {
        where: { deletedAt: null },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function getFutureSelfIdForUser(userId: string) {
  const futureSelf = await db.futureSelf.findUnique({
    where: { userId },
    select: { id: true },
  });

  return futureSelf?.id ?? null;
}
