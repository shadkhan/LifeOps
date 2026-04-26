import type { AIProviderId, AIServiceResult } from "@/lib/ai/types";

export type ActionResult<T> =
  | {
      ok: true;
      message: string;
      data: T;
      meta?: {
        provider: AIProviderId;
        model: string;
      };
    }
  | {
      ok: false;
      message: string;
      data: null;
      meta?: {
        provider?: AIProviderId;
        model?: string;
      };
    };

export function actionError(message: string): ActionResult<never> {
  return {
    ok: false,
    message,
    data: null,
  };
}

export function aiActionResult<T>(result: AIServiceResult<T>, successMessage: string): ActionResult<T> {
  if (!result.ok) {
    return {
      ok: false,
      message: result.error,
      data: null,
      meta: {
        provider: result.provider,
        model: result.model,
      },
    };
  }

  return {
    ok: true,
    message: result.model === "fallback" ? "AI is unavailable, so LifeOps returned a safe manual starter." : successMessage,
    data: result.data,
    meta: {
      provider: result.provider,
      model: result.model,
    },
  };
}

export function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export function readOptionalString(formData: FormData, key: string) {
  const value = readString(formData, key);
  return value.length > 0 ? value : undefined;
}

export function formatDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}
