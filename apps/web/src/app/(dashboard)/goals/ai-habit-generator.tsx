"use client";

import { LoaderCircle, Sparkles } from "lucide-react";
import { useMemo, useState, useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  generateHabitSuggestionsAction,
  type GeneratedHabitSuggestion,
  type GenerateHabitSuggestionsState,
  saveGeneratedHabitsAction,
  type GoalActionState,
} from "./actions";

const initialGenerateState: GenerateHabitSuggestionsState = {
  ok: true,
  message: "",
  suggestions: [],
};

const initialSaveState: GoalActionState = {
  ok: true,
  message: "",
};

export function AIHabitGenerator({ goalId }: { goalId: string }) {
  const [generateState, generateAction, generating] = useActionState(
    generateHabitSuggestionsAction,
    initialGenerateState,
  );
  const [saveState, saveAction, saving] = useActionState(saveGeneratedHabitsAction, initialSaveState);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const selectedHabits = useMemo(
    () => generateState.suggestions.filter((suggestion) => selectedIds.has(suggestion.id)),
    [generateState.suggestions, selectedIds],
  );

  function toggleSuggestion(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <form action={generateAction}>
        <input name="goalId" type="hidden" value={goalId} />
        <Button disabled={generating} type="submit">
          {generating ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate Habits
            </>
          )}
        </Button>
      </form>

      {generating ? (
        <div className="space-y-3 rounded-md border bg-muted/30 p-4" role="status">
          <div className="loader-progress" />
          <div className="skeleton-shimmer h-4 w-2/3 rounded bg-muted" />
          <div className="skeleton-shimmer h-4 w-full rounded bg-muted" />
          <div className="skeleton-shimmer h-4 w-5/6 rounded bg-muted" />
        </div>
      ) : null}

      {generateState.message ? (
        <p
          className={
            generateState.ok
              ? "rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
              : "rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          }
        >
          {generateState.message}
        </p>
      ) : null}

      {generateState.suggestions.length ? (
        <form action={saveAction} className="space-y-4">
          <input name="goalId" type="hidden" value={goalId} />
          <input name="habits" type="hidden" value={JSON.stringify(selectedHabits.map(toSavedHabit))} />

          <div className="space-y-3">
            {generateState.suggestions.map((suggestion) => (
              <label
                className="flex cursor-pointer gap-3 rounded-md border bg-card p-3 transition-colors hover:bg-muted/60"
                key={suggestion.id}
              >
                <input
                  checked={selectedIds.has(suggestion.id)}
                  className="mt-1 h-4 w-4 accent-primary"
                  onChange={() => toggleSuggestion(suggestion.id)}
                  type="checkbox"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{suggestion.name}</span>
                  <span className="mt-1 block text-xs capitalize text-muted-foreground">
                    {suggestion.frequency}
                    {suggestion.suggestedReminderTime ? ` · ${suggestion.suggestedReminderTime}` : ""}
                  </span>
                  <span className="mt-2 block text-sm leading-6 text-muted-foreground">{suggestion.reason}</span>
                </span>
              </label>
            ))}
          </div>

          {saveState.message ? (
            <p
              className={
                saveState.ok
                  ? "rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
                  : "rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              }
            >
              {saveState.message}
            </p>
          ) : null}

          <Button disabled={saving || selectedHabits.length === 0} type="submit">
            {saving ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              `Save selected (${selectedHabits.length})`
            )}
          </Button>
        </form>
      ) : (
        <p className="rounded-md border border-dashed bg-muted/30 p-3 text-sm leading-6 text-muted-foreground">
          AI suggestions will appear here for review. Nothing is saved until you select suggestions and click save.
        </p>
      )}
    </div>
  );
}

function toSavedHabit(suggestion: GeneratedHabitSuggestion) {
  return {
    name: suggestion.name,
    frequency: suggestion.frequency,
    suggestedReminderTime: suggestion.suggestedReminderTime,
    reason: suggestion.reason,
  };
}
