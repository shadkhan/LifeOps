"use server";

import { db, type LifeAreaType } from "@lifeops/db";
import { futureSelfGenerationResponseSchema, futureSelfSchema, idSchema, lifeAreaSchema } from "@lifeops/shared";
import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { getFutureSelfIdForUser } from "@/lib/db/future-self";
import { generateFutureSelfProfile } from "@/server/services/ai-service";

export type ActionState = {
  ok: boolean;
  message: string;
};

export type GenerateFutureSelfState = {
  ok: boolean;
  message: string;
  suggestion: typeof futureSelfGenerationResponseSchema._type | null;
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

export async function generateFutureSelfAction(
  _: GenerateFutureSelfState,
  formData: FormData,
): Promise<GenerateFutureSelfState> {
  const user = await requireCurrentUser();
  const prompt = readString(formData, "prompt");

  if (prompt.length < 10) {
    return { ok: false, message: "Describe the future self you want in at least 10 characters.", suggestion: null };
  }

  const existingFutureSelf = await db.futureSelf.findUnique({
    where: { userId: user.id },
    select: { title: true, description: true, identityStatement: true },
  });

  const result = await generateFutureSelfProfile({
    prompt,
    existingFutureSelf: existingFutureSelf
      ? `${existingFutureSelf.title}\n${existingFutureSelf.identityStatement}\n${existingFutureSelf.description ?? ""}`
      : null,
  });

  if (!result.ok) {
    return { ok: false, message: result.error, suggestion: null };
  }

  return {
    ok: true,
    message:
      result.model === "fallback"
        ? "AI provider unavailable, so LifeOps prepared a manual starter draft."
        : "Future self draft generated for review.",
    suggestion: result.data,
  };
}

export async function saveGeneratedFutureSelfAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireCurrentUser();
  const parsed = futureSelfGenerationResponseSchema.safeParse(parseJson(readString(formData, "suggestion")));
  const selectedLifeAreas = new Set(formData.getAll("lifeAreas").map((value) => String(value)));

  if (!parsed.success) {
    return errorState(parsed.error.issues[0]?.message ?? "Generated future self data is invalid.");
  }

  const futureSelf = await db.futureSelf.upsert({
    where: { userId: user.id },
    update: {
      title: parsed.data.title,
      description: parsed.data.description,
      identityStatement: parsed.data.identityStatement,
    },
    create: {
      userId: user.id,
      title: parsed.data.title,
      description: parsed.data.description,
      identityStatement: parsed.data.identityStatement,
    },
  });

  const lifeAreasToCreate = parsed.data.lifeAreas.filter((_, index) => selectedLifeAreas.has(String(index)));

  if (lifeAreasToCreate.length) {
    await db.lifeArea.createMany({
      data: lifeAreasToCreate.map((area) => ({
        userId: user.id,
        futureSelfId: futureSelf.id,
        name: area.name,
        type: area.type as LifeAreaType,
        vision: area.vision,
        currentReality: area.currentReality,
        gap: area.gap,
      })),
    });
  }

  revalidatePath("/future-self");
  revalidatePath("/dashboard");
  return successState("Generated future self saved.");
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
      deletedAt: null,
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

export async function deleteLifeAreaAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireCurrentUser();
  const lifeAreaId = idSchema.safeParse(readString(formData, "lifeAreaId"));

  if (!lifeAreaId.success) {
    return errorState("Invalid life area.");
  }

  const result = await db.lifeArea.updateMany({
    where: {
      id: lifeAreaId.data,
      userId: user.id,
      deletedAt: null,
    },
    data: {
      deletedAt: new Date(),
    },
  });

  if (result.count === 0) {
    return errorState("Life area not found.");
  }

  revalidatePath("/future-self");
  revalidatePath("/dashboard");
  revalidatePath("/goals");
  return successState("Life area removed.");
}

function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function readOptionalString(formData: FormData, key: string) {
  const value = readString(formData, key);
  return value.length > 0 ? value : undefined;
}

function parseJson(value: string) {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}
