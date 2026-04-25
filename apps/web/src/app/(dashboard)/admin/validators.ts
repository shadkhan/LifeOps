import { z } from "zod";

export const adminAISettingsSchema = z.object({
  provider: z.enum(["openai", "anthropic", "groq"]),
  model: z.string().min(1).max(120),
});

export const userProfileSchema = z.object({
  email: z.string().email().max(255),
  name: z.string().trim().max(120).optional(),
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters.")
    .max(40)
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can use letters, numbers, underscores, and dashes.")
    .optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().optional(),
    newPassword: z.string().min(8, "New password must be at least 8 characters.").max(128),
    confirmPassword: z.string().min(1, "Confirm your new password."),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "New passwords do not match.",
    path: ["confirmPassword"],
  });
