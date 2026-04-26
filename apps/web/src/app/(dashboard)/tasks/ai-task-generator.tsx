"use client";

import { useActionState, useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  generateTasksFromIdeaAction,
  saveTaskSuggestionsAction,
  type TaskActionState,
  type TaskSuggestionState,
} from "./actions";

const initialGenerateState: TaskSuggestionState = {
  ok: false,
  message: "",
  suggestions: [],
};

const initialSaveState: TaskActionState = {
  ok: false,
  message: "",
};

export function AITaskGenerator({ goals }: { goals: Array<{ id: string; title: string }> }) {
  const [generateState, generateAction, isGenerating] = useActionState(generateTasksFromIdeaAction, initialGenerateState);
  const [saveState, saveAction, isSaving] = useActionState(saveTaskSuggestionsAction, initialSaveState);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    setSelected(generateState.suggestions.map((_, index) => String(index)));
  }, [generateState.suggestions]);

  const selectedTasks = generateState.suggestions.filter((_, index) => selected.includes(String(index)));

  return (
    <div className="space-y-4">
      <form action={generateAction} className="space-y-3">
        <label className="block space-y-2 text-sm font-medium">
          <span>Source type</span>
          <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" name="sourceType" defaultValue="idea">
            <option value="idea">Idea</option>
            <option value="goal">Goal</option>
            <option value="habit">Habit</option>
            <option value="note">Note</option>
          </select>
        </label>
        <label className="block space-y-2 text-sm font-medium">
          <span>Source text</span>
          <textarea
            className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            name="idea"
            placeholder="Example: I want to prepare for my certification exam while keeping workouts consistent."
            required
          />
        </label>
        <Button disabled={isGenerating} type="submit" variant="outline">
          <Sparkles className="h-4 w-4" />
          {isGenerating ? "Generating..." : "Create tasks"}
        </Button>
      </form>
      {generateState.message ? (
        <p className={generateState.ok ? "text-sm text-emerald-700" : "text-sm text-red-700"}>{generateState.message}</p>
      ) : null}
      {generateState.suggestions.length ? (
        <form action={saveAction} className="space-y-3 rounded-md border bg-muted/30 p-4">
          <input name="tasks" type="hidden" value={JSON.stringify(selectedTasks)} />
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
          {generateState.suggestions.map((task, index) => {
            const value = String(index);
            return (
              <label className="flex gap-3 rounded-md border bg-background p-3 text-sm" key={`${task.title}-${index}`}>
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
                  <span className="block font-medium">{task.title}</span>
                  <span className="mt-1 block leading-6 text-muted-foreground">{task.priority} priority</span>
                  <span className="mt-1 block leading-6 text-muted-foreground">{task.description ?? task.reason}</span>
                </span>
              </label>
            );
          })}
          <Button disabled={isSaving || selectedTasks.length === 0} type="submit">
            {isSaving ? "Saving..." : "Save selected tasks"}
          </Button>
          {saveState.message ? (
            <p className={saveState.ok ? "text-sm text-emerald-700" : "text-sm text-red-700"}>{saveState.message}</p>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}
