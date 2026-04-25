"use server";

import { db, type LifeAreaType } from "@lifeops/db";
import { futureSelfSchema, idSchema, lifeAreaSchema } from "@lifeops/shared";
import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { getFutureSelfIdForUser } from "@/lib/db/future-self";

export type ActionState = {
  ok: boolean;
  message: string;
};

const errorState = (message: string): ActionState => ({ ok: false, message });
const successState = (message: string): ActionState => ({ ok: true, message });

export async function saveFutureSelfAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireCurrentUser();
  const parsed = futureSelfSchema.safeParse({
    title: readString(formData, "title"),
    description: readOptionalString(formData, "description"),
    identityStatement: readString(formData, "identityStatement"),
  });

  if (!parsed.success) {
    return errorState(parsed.error.issues[0]?.message ?? "Check the future self fields.");
  }

  await db.futureSelf.upsert({
    where: { userId: user.id },
    update: parsed.data,
    create: {
      ...parsed.data,
      userId: user.id,
    },
  });

  revalidatePath("/future-self");
  revalidatePath("/dashboard");
  return successState("Future self profile saved.");
}

export async function addLifeAreaAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireCurrentUser();
  const futureSelfId = await getFutureSelfIdForUser(user.id);

  if (!futureSelfId) {
    return errorState("Create your future self profile before adding life areas.");
  }

  const parsed = lifeAreaSchema.safeParse({
    futureSelfId,
    name: readString(formData, "name"),
    type: readString(formData, "type"),
    vision: readOptionalString(formData, "vision"),
    currentReality: readOptionalString(formData, "currentReality"),
    gap: readOptionalString(formData, "gap"),
  });

  if (!parsed.success) {
    return errorState(parsed.error.issues[0]?.message ?? "Check the life area fields.");
  }

  await db.lifeArea.create({
    data: {
      userId: user.id,
      futureSelfId,
      name: parsed.data.name,
      type: parsed.data.type as LifeAreaType,
      vision: parsed.data.vision,
      currentReality: parsed.data.currentReality,
      gap: parsed.data.gap,
    },
  });

  revalidatePath("/future-self");
  revalidatePath("/dashboard");
  return successState("Life area added.");
}

export async function updateLifeAreaAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireCurrentUser();
  const lifeAreaId = readString(formData, "lifeAreaId");
  const id = idSchema.safeParse(lifeAreaId);

  if (!id.success) {
    return errorState("Invalid life area.");
  }

  const parsed = lifeAreaSchema.omit({ futureSelfId: true }).safeParse({
    name: readString(formData, "name"),
    type: readString(formData, "type"),
    vision: readOptionalString(formData, "vision"),
    currentReality: readOptionalString(formData, "currentReality"),
    gap: readOptionalString(formData, "gap"),
  });

  if (!parsed.success) {
    return errorState(parsed.error.issues[0]?.message ?? "Check the life area fields.");
  }

  const result = await db.lifeArea.updateMany({
    where: {
      id: id.data,
      userId: user.id,
    },
    data: {
      name: parsed.data.name,
      type: parsed.data.type as LifeAreaType,
      vision: parsed.data.vision,
      currentReality: parsed.data.currentReality,
      gap: parsed.data.gap,
    },
  });

  if (result.count === 0) {
    return errorState("Life area not found.");
  }

  revalidatePath("/future-self");
  revalidatePath("/dashboard");
  return successState("Life area updated.");
}

function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function readOptionalString(formData: FormData, key: string) {
  const value = readString(formData, key);
  return value.length > 0 ? value : undefined;
}
