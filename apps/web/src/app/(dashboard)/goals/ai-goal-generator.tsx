"use client";

import { useActionState, useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  generateGoalsFromFutureSelfAction,
  saveGeneratedGoalsAction,
  type GenerateGoalsState,
  type GoalActionState,
} from "./actions";

const initialGenerateState: GenerateGoalsState = {
  ok: false,
  message: "",
  suggestions: [],
};

const initialSaveState: GoalActionState = {
  ok: false,
  message: "",
};

export function AIGoalGenerator() {
  const [generateState, generateAction, isGenerating] = useActionState(generateGoalsFromFutureSelfAction, initialGenerateState);
  const [saveState, saveAction, isSaving] = useActionState(saveGeneratedGoalsAction, initialSaveState);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    setSelected(generateState.suggestions.map((_, index) => String(index)));
  }, [generateState.suggestions]);

  const selectedGoals = generateState.suggestions.filter((_, index) => selected.includes(String(index)));

  return (
    <div className="space-y-4">
      <form action={generateAction}>
        <Button disabled={isGenerating} type="submit" variant="outline">
          <Sparkles className="h-4 w-4" />
          {isGenerating ? "Generating..." : "Generate goals from Future Self"}
        </Button>
      </form>
      {generateState.message ? (
        <p className={generateState.ok ? "text-sm text-emerald-700" : "text-sm text-red-700"}>{generateState.message}</p>
      ) : null}
      {generateState.suggestions.length ? (
        <form action={saveAction} className="space-y-3 rounded-md border bg-muted/30 p-4">
          <input name="goals" type="hidden" value={JSON.stringify(selectedGoals)} />
          {generateState.suggestions.map((goal, index) => {
            const value = String(index);
            return (
              <label className="flex gap-3 rounded-md border bg-background p-3 text-sm" key={`${goal.title}-${index}`}>
                <input
                  checked={selected.includes(value)}
                  onChange={(event) => {
                    setSelected((current) =>
                      event.target.checked ? [...current, value] : current.filter((item) => item !== value),
                    );
                  }}
                  type="checkbox"
                />
                <span>
                  <span className="block font-medium">{goal.title}</span>
                  <span className="mt-1 block leading-6 text-muted-foreground">
                    {goal.lifeAreaName} · {goal.priority} priority
                  </span>
                  <span className="mt-1 block leading-6 text-muted-foreground">{goal.description}</span>
                </span>
              </label>
            );
          })}
          <Button disabled={isSaving || selectedGoals.length === 0} type="submit">
            {isSaving ? "Saving..." : "Save selected goals"}
          </Button>
          {saveState.message ? (
            <p className={saveState.ok ? "text-sm text-emerald-700" : "text-sm text-red-700"}>{saveState.message}</p>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}
