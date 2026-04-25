"use client";

import type { GoalStatus, LifeAreaType, Priority } from "@lifeops/db";
import { LoaderCircle, Trash2 } from "lucide-react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  createGoalAction,
  deleteGoalAction,
  type GoalActionState,
  updateGoalAction,
  updateGoalStatusAction,
} from "./actions";

const initialState: GoalActionState = {
  ok: true,
  message: "",
};

const goalStatusOptions: GoalStatus[] = ["active", "paused", "completed", "archived"];
const priorityOptions: Priority[] = ["low", "medium", "high"];

export type GoalFormLifeArea = {
  id: string;
  name: string;
  type: LifeAreaType;
};

export type GoalFormValue = {
  id: string;
  title: string;
  description: string | null;
  lifeAreaId: string;
  status: GoalStatus;
  priority: Priority;
  targetDate: Date | null;
  progress: number;
};

export function CreateGoalForm({ lifeAreas }: { lifeAreas: GoalFormLifeArea[] }) {
  const [state, action, pending] = useActionState(createGoalAction, initialState);

  return (
    <GoalForm
      action={action}
      lifeAreas={lifeAreas}
      pending={pending}
      state={state}
      submitLabel="Create goal"
      submittingLabel="Creating..."
    />
  );
}

export function EditGoalForm({
  goal,
  lifeAreas,
}: {
  goal: GoalFormValue;
  lifeAreas: GoalFormLifeArea[];
}) {
  const [state, action, pending] = useActionState(updateGoalAction, initialState);

  return (
    <GoalForm
      action={action}
      goal={goal}
      lifeAreas={lifeAreas}
      pending={pending}
      state={state}
      submitLabel="Save goal"
      submittingLabel="Saving..."
    />
  );
}

export function GoalStatusForm({
  goalId,
  status,
}: {
  goalId: string;
  status: GoalStatus;
}) {
  return (
    <form action={updateGoalStatusAction}>
      <input name="goalId" type="hidden" value={goalId} />
      <label className="sr-only" htmlFor={`status-${goalId}`}>
        Goal status
      </label>
      <select
        className="h-9 rounded-md border bg-background px-2 text-sm capitalize outline-none transition-colors focus:ring-2 focus:ring-primary"
        defaultValue={status}
        id={`status-${goalId}`}
        name="status"
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
      >
        {goalStatusOptions.map((option) => (
          <option key={option} value={option}>
            {formatOption(option)}
          </option>
        ))}
      </select>
    </form>
  );
}

export function DeleteGoalButton({
  goalId,
  redirectTo = "/goals",
}: {
  goalId: string;
  redirectTo?: string;
}) {
  return (
    <form action={deleteGoalAction}>
      <input name="goalId" type="hidden" value={goalId} />
      <input name="redirectTo" type="hidden" value={redirectTo} />
      <Button
        aria-label="Delete goal"
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

function GoalForm({
  action,
  goal,
  lifeAreas,
  pending,
  state,
  submitLabel,
  submittingLabel,
}: {
  action: (formData: FormData) => void;
  goal?: GoalFormValue;
  lifeAreas: GoalFormLifeArea[];
  pending: boolean;
  state: GoalActionState;
  submitLabel: string;
  submittingLabel: string;
}) {
  const disabled = lifeAreas.length === 0 || pending;

  return (
    <form action={action} className="space-y-4">
      {goal ? <input name="goalId" type="hidden" value={goal.id} /> : null}

      <TextField
        defaultValue={goal?.title ?? ""}
        label="Title"
        name="title"
        placeholder="Example: Build a consistent strength training habit"
        required
      />

      <TextArea
        defaultValue={goal?.description ?? ""}
        label="Description"
        name="description"
        placeholder="Example: Train 4 days per week, improve energy, and become the kind of person who keeps health promises."
        rows={4}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          defaultValue={goal?.lifeAreaId ?? lifeAreas[0]?.id ?? ""}
          disabled={disabled}
          label="Life area"
          name="lifeAreaId"
          options={lifeAreas.map((lifeArea) => ({
            label: `${lifeArea.name} (${formatOption(lifeArea.type)})`,
            value: lifeArea.id,
          }))}
        />
        <SelectField
          defaultValue={goal?.status ?? "active"}
          label="Status"
          name="status"
          options={goalStatusOptions.map((status) => ({ label: formatOption(status), value: status }))}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SelectField
          defaultValue={goal?.priority ?? "medium"}
          label="Priority"
          name="priority"
          options={priorityOptions.map((priority) => ({ label: formatOption(priority), value: priority }))}
        />
        <TextField
          defaultValue={formatDateInput(goal?.targetDate)}
          label="Target date"
          name="targetDate"
          type="date"
        />
        <TextField
          defaultValue={String(goal?.progress ?? 0)}
          label="Progress percentage"
          max={100}
          min={0}
          name="progress"
          type="number"
        />
      </div>

      <FormMessage state={state} />

      {lifeAreas.length === 0 ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Create a Future Self life area before adding goals.
        </p>
      ) : null}

      <Button disabled={disabled} type="submit">
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
  min,
  max,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  type?: "text" | "date" | "number";
  min?: number;
  max?: number;
}) {
  return (
    <label className="block space-y-2 text-sm font-medium">
      <span>{label}</span>
      <input
        className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-primary"
        defaultValue={defaultValue}
        max={max}
        min={min}
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
  disabled,
  options,
}: {
  label: string;
  name: string;
  defaultValue: string;
  disabled?: boolean;
  options: Array<{ label: string; value: string }>;
}) {
  return (
    <label className="block space-y-2 text-sm font-medium">
      <span>{label}</span>
      <select
        className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none transition-colors focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
        defaultValue={defaultValue}
        disabled={disabled}
        name={name}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function FormMessage({ state }: { state: GoalActionState }) {
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

function formatDateInput(date?: Date | null) {
  if (!date) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function formatOption(value: string) {
  return value.replaceAll("_", " ");
}
