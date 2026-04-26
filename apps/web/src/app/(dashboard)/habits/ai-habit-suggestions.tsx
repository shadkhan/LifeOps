"use client";

import { useActionState, useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveHabitSuggestionsAction, suggestHabitsAction, type HabitActionState, type HabitSuggestionState } from "./actions";

const initialSuggestState: HabitSuggestionState = {
  ok: false,
  message: "",
  suggestions: [],
};

const initialSaveState: HabitActionState = {
  ok: false,
  message: "",
};

export function AIHabitSuggestions({ goals }: { goals: Array<{ id: string; title: string }> }) {
  const [suggestState, suggestAction, isGenerating] = useActionState(suggestHabitsAction, initialSuggestState);
  const [saveState, saveAction, isSaving] = useActionState(saveHabitSuggestionsAction, initialSaveState);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    setSelected(suggestState.suggestions.map((_, index) => String(index)));
  }, [suggestState.suggestions]);

  const selectedHabits = suggestState.suggestions.filter((_, index) => selected.includes(String(index)));

  return (
    <div className="space-y-4">
      <form action={suggestAction}>
        <Button disabled={isGenerating} type="submit" variant="outline">
          <Sparkles className="h-4 w-4" />
          {isGenerating ? "Generating..." : "Suggest habits from context"}
        </Button>
      </form>
      {suggestState.message ? (
        <p className={suggestState.ok ? "text-sm text-emerald-700" : "text-sm text-red-700"}>{suggestState.message}</p>
      ) : null}
      {suggestState.suggestions.length ? (
        <form action={saveAction} className="space-y-3 rounded-md border bg-muted/30 p-4">
          <input name="habits" type="hidden" value={JSON.stringify(selectedHabits)} />
          <label className="block space-y-2 text-sm font-medium">
            <span>Optional linked goal</span>
            <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" name="goalId">
              <option value="">No linked goal</option>
              {goals.map((goal) => (
                <option key={goal.id} value={goal.id}>
                  {goal.title}
                </option>
              ))}
            </select>
          </label>
          {suggestState.suggestions.map((habit, index) => {
            const value = String(index);
            return (
              <label className="flex gap-3 rounded-md border bg-background p-3 text-sm" key={`${habit.name}-${index}`}>
                <input
                  checked={selected.includes(value)}
                  onChange={(event) =>
                    setSelected((current) =>
                      event.target.checked ? [...current, value] : current.filter((item) => item !== value),
                    )
                  }
                  type="checkbox"
                />
                <span>
                  <span className="block font-medium">{habit.name}</span>
                  <span className="mt-1 block leading-6 text-muted-foreground">
                    {habit.frequency}
                    {habit.suggestedReminderTime ? ` · ${habit.suggestedReminderTime}` : ""}
                  </span>
                  <span className="mt-1 block leading-6 text-muted-foreground">{habit.reason}</span>
                </span>
              </label>
            );
          })}
          <Button disabled={isSaving || selectedHabits.length === 0} type="submit">
            {isSaving ? "Saving..." : "Save selected habits"}
          </Button>
          {saveState.message ? (
            <p className={saveState.ok ? "text-sm text-emerald-700" : "text-sm text-red-700"}>{saveState.message}</p>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}
