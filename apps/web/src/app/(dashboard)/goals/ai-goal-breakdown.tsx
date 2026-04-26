"use client";

import { useActionState, useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { breakDownGoalAction, saveGoalBreakdownAction, type GoalActionState, type GoalBreakdownState } from "./actions";

const initialBreakdownState: GoalBreakdownState = {
  ok: false,
  message: "",
  breakdown: null,
};

const initialSaveState: GoalActionState = {
  ok: false,
  message: "",
};

export function AIGoalBreakdown({ goalId }: { goalId: string }) {
  const [breakdownState, breakdownAction, isGenerating] = useActionState(breakDownGoalAction, initialBreakdownState);
  const [saveState, saveAction, isSaving] = useActionState(saveGoalBreakdownAction, initialSaveState);
  const [selectedHabits, setSelectedHabits] = useState<string[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

  useEffect(() => {
    if (breakdownState.breakdown) {
      setSelectedHabits(breakdownState.breakdown.habits.map((_, index) => String(index)));
      setSelectedTasks(breakdownState.breakdown.tasks.map((_, index) => String(index)));
    }
  }, [breakdownState.breakdown]);

  const habits = breakdownState.breakdown?.habits.filter((_, index) => selectedHabits.includes(String(index))) ?? [];
  const tasks = breakdownState.breakdown?.tasks.filter((_, index) => selectedTasks.includes(String(index))) ?? [];

  return (
    <div className="space-y-4">
      <form action={breakdownAction}>
        <input name="goalId" type="hidden" value={goalId} />
        <Button disabled={isGenerating} type="submit" variant="outline">
          <Sparkles className="h-4 w-4" />
          {isGenerating ? "Breaking down..." : "Break down goal"}
        </Button>
      </form>

      {breakdownState.message ? (
        <p className={breakdownState.ok ? "text-sm text-emerald-700" : "text-sm text-red-700"}>{breakdownState.message}</p>
      ) : null}

      {breakdownState.breakdown ? (
        <form action={saveAction} className="space-y-4 rounded-md border bg-muted/30 p-4">
          <input name="goalId" type="hidden" value={goalId} />
          <input name="habits" type="hidden" value={JSON.stringify(habits)} />
          <input name="tasks" type="hidden" value={JSON.stringify(tasks)} />
          <p className="text-sm leading-6 text-muted-foreground">{breakdownState.breakdown.summary}</p>

          <SelectableList
            items={breakdownState.breakdown.tasks.map((task) => ({
              title: task.title,
              description: task.description ?? task.reason,
            }))}
            selected={selectedTasks}
            setSelected={setSelectedTasks}
            title="Tasks to save"
          />
          <SelectableList
            items={breakdownState.breakdown.habits.map((habit) => ({
              title: habit.name,
              description: habit.description ?? habit.reason,
            }))}
            selected={selectedHabits}
            setSelected={setSelectedHabits}
            title="Habits to save"
          />

          <Button disabled={isSaving || (habits.length === 0 && tasks.length === 0)} type="submit">
            {isSaving ? "Saving..." : "Save selected breakdown"}
          </Button>
          {saveState.message ? (
            <p className={saveState.ok ? "text-sm text-emerald-700" : "text-sm text-red-700"}>{saveState.message}</p>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}

function SelectableList({
  items,
  selected,
  setSelected,
  title,
}: {
  items: Array<{ title: string; description: string }>;
  selected: string[];
  setSelected: React.Dispatch<React.SetStateAction<string[]>>;
  title: string;
}) {
  if (!items.length) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{title}</p>
      {items.map((item, index) => {
        const value = String(index);
        return (
          <label className="flex gap-3 rounded-md border bg-background p-3 text-sm" key={`${title}-${item.title}-${index}`}>
            <input
              checked={selected.includes(value)}
              onChange={(event) => {
                setSelected((current) =>
                  event.target.checked ? [...current, value] : current.filter((selectedValue) => selectedValue !== value),
                );
              }}
              type="checkbox"
            />
            <span>
              <span className="block font-medium">{item.title}</span>
              <span className="mt-1 block leading-6 text-muted-foreground">{item.description}</span>
            </span>
          </label>
        );
      })}
    </div>
  );
}
