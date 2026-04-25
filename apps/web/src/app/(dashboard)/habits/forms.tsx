"use client";

import type { HabitFrequency, HabitStatus } from "@lifeops/db";
import { Check, LoaderCircle, Trash2 } from "lucide-react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  completeHabitTodayAction,
  createHabitAction,
  deleteHabitAction,
  type HabitActionState,
  missHabitTodayAction,
  updateHabitAction,
} from "./actions";

const initialState: HabitActionState = {
  ok: true,
  message: "",
};

const frequencyOptions: HabitFrequency[] = ["daily", "weekdays", "weekly", "monthly", "custom"];

export type HabitGoalOption = {
  id: string;
  title: string;
  lifeArea: {
    name: string;
  };
};

export type HabitFormValue = {
  id: string;
  goalId: string | null;
  name: string;
  description: string | null;
  frequency: HabitFrequency;
  customFrequency: string | null;
  reminderTime: string | null;
  streak: number;
  status: HabitStatus;
};

export function CreateHabitForm({ goals }: { goals: HabitGoalOption[] }) {
  const [state, action, pending] = useActionState(createHabitAction, initialState);

  return (
    <HabitForm
      action={action}
      goals={goals}
      pending={pending}
      state={state}
      submitLabel="Create habit"
      submittingLabel="Creating..."
    />
  );
}

export function EditHabitForm({
  goals,
  habit,
}: {
  goals: HabitGoalOption[];
  habit: HabitFormValue;
}) {
  const [state, action, pending] = useActionState(updateHabitAction, initialState);

  return (
    <HabitForm
      action={action}
      goals={goals}
      habit={habit}
      pending={pending}
      state={state}
      submitLabel="Save habit"
      submittingLabel="Saving..."
    />
  );
}

export function CompleteHabitButton({
  completedToday,
  habitId,
}: {
  completedToday: boolean;
  habitId: string;
}) {
  return (
    <form action={completeHabitTodayAction}>
      <input name="habitId" type="hidden" value={habitId} />
      <Button disabled={completedToday} size="default" type="submit">
        <Check className="h-4 w-4" />
        {completedToday ? "Completed today" : "Complete today"}
      </Button>
    </form>
  );
}

export function MissedHabitReflectionForm({ habitId }: { habitId: string }) {
  return (
    <form action={missHabitTodayAction} className="space-y-2">
      <input name="habitId" type="hidden" value={habitId} />
      <label className="block space-y-2 text-sm font-medium">
        <span>Missed reflection</span>
        <textarea
          className="min-h-20 w-full resize-y rounded-md border bg-background px-3 py-2 text-sm leading-6 outline-none transition-colors placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-primary"
          name="reflection"
          placeholder="What got in the way today?"
        />
      </label>
      <Button type="submit" variant="outline">
        Save missed reflection
      </Button>
    </form>
  );
}

export function DeleteHabitButton({ habitId }: { habitId: string }) {
  return (
    <form action={deleteHabitAction}>
      <input name="habitId" type="hidden" value={habitId} />
      <Button
        aria-label="Delete habit"
        className="border-red-200 text-red-700 hover:bg-red-50"
        size="icon"
        type="submit"
        variant="outline"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </form>
  );
}

function HabitForm({
  action,
  goals,
  habit,
  pending,
  state,
  submitLabel,
  submittingLabel,
}: {
  action: (formData: FormData) => void;
  goals: HabitGoalOption[];
  habit?: HabitFormValue;
  pending: boolean;
  state: HabitActionState;
  submitLabel: string;
  submittingLabel: string;
}) {
  return (
    <form action={action} className="space-y-4">
      {habit ? <input name="habitId" type="hidden" value={habit.id} /> : null}
      <input name="streak" type="hidden" value={habit?.streak ?? 0} />

      <TextField
        defaultValue={habit?.name ?? ""}
        label="Name"
        name="name"
        placeholder="Example: 30 minutes of strength training"
        required
      />

      <TextArea
        defaultValue={habit?.description ?? ""}
        label="Description"
        name="description"
        placeholder="Example: Move before work so health gets attention before the day gets noisy."
        rows={3}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          defaultValue={habit?.goalId ?? ""}
          label="Linked goal"
          name="goalId"
          options={[
            { label: "No linked goal", value: "" },
            ...goals.map((goal) => ({
              label: `${goal.title} (${goal.lifeArea.name})`,
              value: goal.id,
            })),
          ]}
        />
        <SelectField
          defaultValue={habit?.frequency ?? "daily"}
          label="Frequency"
          name="frequency"
          options={frequencyOptions.map((frequency) => ({
            label: formatOption(frequency),
            value: frequency,
          }))}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          defaultValue={habit?.customFrequency ?? ""}
          label="Custom frequency"
          name="customFrequency"
          placeholder="Example: Every Monday, Wednesday, and Friday"
        />
        <TextField defaultValue={habit?.reminderTime ?? ""} label="Reminder time" name="reminderTime" type="time" />
      </div>

      <label className="flex items-center gap-3 rounded-md border bg-muted/30 p-3 text-sm font-medium">
        <input
          className="h-4 w-4 accent-primary"
          defaultChecked={habit?.status !== "paused" && habit?.status !== "archived"}
          name="isActive"
          type="checkbox"
        />
        Is active
      </label>

      <FormMessage state={state} />

      <Button disabled={pending} type="submit">
        {pending ? <PendingLabel label={submittingLabel} /> : submitLabel}
      </Button>
    </form>
  );
}

function PendingLabel({ label }: { label: string }) {
  return (
    <>
      <LoaderCircle className="h-4 w-4 animate-spin" />
      {label}
    </>
  );
}

function TextField({
  label,
  name,
  defaultValue,
  placeholder,
  required,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  type?: "text" | "time";
}) {
  return (
    <label className="block space-y-2 text-sm font-medium">
      <span>{label}</span>
      <input
        className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-primary"
        defaultValue={defaultValue}
        name={name}
        placeholder={placeholder}
        required={required}
        type={type}
      />
    </label>
  );
}

function TextArea({
  label,
  name,
  defaultValue,
  placeholder,
  rows,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  rows: number;
}) {
  return (
    <label className="block space-y-2 text-sm font-medium">
      <span>{label}</span>
      <textarea
        className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm leading-6 outline-none transition-colors placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-primary"
        defaultValue={defaultValue}
        name={name}
        placeholder={placeholder}
        rows={rows}
      />
    </label>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue: string;
  options: Array<{ label: string; value: string }>;
}) {
  return (
    <label className="block space-y-2 text-sm font-medium">
      <span>{label}</span>
      <select
        className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none transition-colors focus:ring-2 focus:ring-primary"
        defaultValue={defaultValue}
        name={name}
      >
        {options.map((option) => (
          <option key={option.value || "none"} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function FormMessage({ state }: { state: HabitActionState }) {
  if (!state.message) {
    return null;
  }

  return (
    <p
      className={
        state.ok
          ? "rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
          : "rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
      }
    >
      {state.message}
    </p>
  );
}

function formatOption(value: string) {
  return value.replaceAll("_", " ");
}
