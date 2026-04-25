"use client";

import type { AIProvider } from "@lifeops/db";
import { LoaderCircle } from "lucide-react";
import { useActionState, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { aiModelOptions, aiProviderOptions, type AIProviderId } from "@/lib/ai/types";
import { updateAdminAISettingsAction, type AdminSettingsState } from "./actions";

const initialState: AdminSettingsState = {
  ok: true,
  message: "",
};

export function AISettingsForm({
  model,
  provider,
}: {
  model: string;
  provider: AIProvider;
}) {
  const [state, action, pending] = useActionState(updateAdminAISettingsAction, initialState);
  const [selectedProvider, setSelectedProvider] = useState<AIProviderId>(provider.toLowerCase() as AIProviderId);
  const models = useMemo(() => aiModelOptions[selectedProvider], [selectedProvider]);

  return (
    <form action={action} className="space-y-4">
      <label className="block space-y-2 text-sm font-medium">
        <span>AI provider</span>
        <select
          className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
          defaultValue={selectedProvider}
          name="provider"
          onChange={(event) => setSelectedProvider(event.currentTarget.value as AIProviderId)}
        >
          {aiProviderOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-2 text-sm font-medium">
        <span>Model</span>
        <select
          className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
          key={selectedProvider}
          defaultValue={models.includes(model) ? model : models[0]}
          name="model"
        >
          {models.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>

      {state.message ? (
        <p
          className={
            state.ok
              ? "rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
              : "rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          }
        >
          {state.message}
        </p>
      ) : null}

      <Button disabled={pending} type="submit">
        {pending ? (
          <>
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Save AI settings"
        )}
      </Button>
    </form>
  );
}
