import assert from "node:assert/strict";
import test from "node:test";

import {
  adminAISettingsSchema,
  changePasswordSchema,
  userProfileSchema,
} from "../apps/web/src/app/(dashboard)/admin/validators.ts";

test("admin AI settings validation accepts configured Groq model", () => {
  const parsed = adminAISettingsSchema.safeParse({
    provider: "groq",
    model: "llama-3.1-8b-instant",
  });

  assert.equal(parsed.success, true);
});

test("admin AI settings validation rejects unsupported provider", () => {
  const parsed = adminAISettingsSchema.safeParse({
    provider: "browser-ai",
    model: "unknown",
  });

  assert.equal(parsed.success, false);
});

test("profile validation normalizes allowed account fields", () => {
  const parsed = userProfileSchema.safeParse({
    email: "admin@lifeops.local",
    name: "Admin",
    username: "admin_user",
  });

  assert.equal(parsed.success, true);
});

test("profile validation rejects unsafe username characters", () => {
  const parsed = userProfileSchema.safeParse({
    email: "admin@lifeops.local",
    username: "admin user!",
  });

  assert.equal(parsed.success, false);
});

test("password validation requires matching confirmation", () => {
  const parsed = changePasswordSchema.safeParse({
    currentPassword: "password123",
    newPassword: "new-password-123",
    confirmPassword: "different-password",
  });

  assert.equal(parsed.success, false);
});

test("password validation accepts strong matching password", () => {
  const parsed = changePasswordSchema.safeParse({
    currentPassword: "password123",
    newPassword: "new-password-123",
    confirmPassword: "new-password-123",
  });

  assert.equal(parsed.success, true);
});
