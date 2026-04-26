"use client";

import { useActionState, useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  generateFutureSelfAction,
  saveGeneratedFutureSelfAction,
  type ActionState,
  type GenerateFutureSelfState,
} from "./actions";

const initialGenerateState: GenerateFutureSelfState = {
  ok: false,
  message: "",
  suggestion: null,
};

const initialSaveState: ActionState = {
  ok: false,
  message: "",
};

export function AIFutureSelfGenerator() {
  const [generateState, generateAction, isGenerating] = useActionState(generateFutureSelfAction, initialGenerateState);
  const [saveState, saveAction, isSaving] = useActionState(saveGeneratedFutureSelfAction, initialSaveState);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (generateState.suggestion) {
      setSelected(generateState.suggestion.lifeAreas.map((_, index) => String(index)));
    }
  }, [generateState.suggestion]);

  return (
    <div className="space-y-4">
      <form action={generateAction} className="space-y-3">
        <label className="block space-y-2 text-sm font-medium">
          <span>Simple prompt</span>
          <textarea
            className="min-h-28 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-primary"
            name="prompt"
            placeholder="Example: I want to become a calmer, healthier product builder who ships consistently, protects family time, and learns every week."
            required
          />
        </label>
        <Button disabled={isGenerating} type="submit">
          <Sparkles className="h-4 w-4" />
          {isGenerating ? "Generating..." : "Generate draft"}
        </Button>
      </form>

      {generateState.message ? (
        <p className={generateState.ok ? "text-sm text-emerald-700" : "text-sm text-red-700"}>{generateState.message}</p>
      ) : null}

      {generateState.suggestion ? (
        <form action={saveAction} className="space-y-4 rounded-md border bg-muted/30 p-4">
          <input name="suggestion" type="hidden" value={JSON.stringify(generateState.suggestion)} />
          <div>
            <p className="text-sm font-semibold">{generateState.suggestion.title}</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{generateState.suggestion.identityStatement}</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{generateState.suggestion.description}</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Life areas to save</p>
            {generateState.suggestion.lifeAreas.map((area, index) => {
              const value = String(index);
              return (
                <label className="flex gap-3 rounded-md border bg-background p-3 text-sm" key={`${area.name}-${index}`}>
                  <input
                    checked={selected.includes(value)}
                    name="lifeAreas"
                    onChange={(event) => {
                      setSelected((current) =>
                        event.target.checked ? [...current, value] : current.filter((item) => item !== value),
                      );
                    }}
                    type="checkbox"
                    value={value}
                  />
                  <span>
                    <span className="block font-medium">{area.name}</span>
                    <span className="mt-1 block leading-6 text-muted-foreground">{area.vision}</span>
                  </span>
                </label>
              );
            })}
          </div>

          <Button disabled={isSaving} type="submit">
            {isSaving ? "Saving..." : "Save reviewed draft"}
          </Button>
          {saveState.message ? (
            <p className={saveState.ok ? "text-sm text-emerald-700" : "text-sm text-red-700"}>{saveState.message}</p>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}
