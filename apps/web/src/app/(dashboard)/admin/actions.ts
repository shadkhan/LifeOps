"use server";

import type { AIProvider } from "@lifeops/db";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { db } from "@lifeops/db";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { aiModelOptions } from "@/lib/ai/types";
import { updateAISettings } from "@/server/services/ai-service";
import { adminAISettingsSchema, changePasswordSchema, userProfileSchema } from "./validators";

export type AdminSettingsState = {
  ok: boolean;
  message: string;
};

export async function updateAdminAISettingsAction(
  _: AdminSettingsState,
  formData: FormData,
): Promise<AdminSettingsState> {
  const parsed = adminAISettingsSchema.safeParse({
    provider: String(formData.get("provider") ?? ""),
    model: String(formData.get("model") ?? "").trim(),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check AI settings." };
  }

  if (!aiModelOptions[parsed.data.provider].includes(parsed.data.model)) {
    return { ok: false, message: "Choose a supported model for the selected provider." };
  }

  await updateAISettings({
    provider: parsed.data.provider as AIProvider,
    model: parsed.data.model,
  });

  revalidatePath("/admin");
  return { ok: true, message: "AI settings saved." };
}

export async function updateUserProfileAction(
  _: AdminSettingsState,
  formData: FormData,
): Promise<AdminSettingsState> {
  const user = await requireCurrentUser();
  const parsed = userProfileSchema.safeParse({
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    name: readOptionalString(formData, "name"),
    username: readOptionalString(formData, "username")?.toLowerCase(),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check profile details." };
  }

  const duplicate = await db.user.findFirst({
    where: {
      id: { not: user.id },
      OR: [{ email: parsed.data.email }, ...(parsed.data.username ? [{ username: parsed.data.username }] : [])],
    },
    select: { id: true, email: true, username: true },
  });

  if (duplicate?.email === parsed.data.email) {
    return { ok: false, message: "That email is already in use." };
  }

  if (parsed.data.username && duplicate?.username === parsed.data.username) {
    return { ok: false, message: "That username is already in use." };
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      email: parsed.data.email,
      name: parsed.data.name,
      username: parsed.data.username,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  return { ok: true, message: "Profile details saved." };
}

export async function changePasswordAction(
  _: AdminSettingsState,
  formData: FormData,
): Promise<AdminSettingsState> {
  const user = await requireCurrentUser();
  const parsed = changePasswordSchema.safeParse({
    currentPassword: String(formData.get("currentPassword") ?? ""),
    newPassword: String(formData.get("newPassword") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check password fields." };
  }

  const existing = await db.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });

  if (existing?.passwordHash) {
    const matches = await bcrypt.compare(parsed.data.currentPassword ?? "", existing.passwordHash);

    if (!matches) {
      return { ok: false, message: "Current password is incorrect." };
    }
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await bcrypt.hash(parsed.data.newPassword, 12),
    },
  });

  return { ok: true, message: "Password changed." };
}

function readOptionalString(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value.length > 0 ? value : undefined;
}
