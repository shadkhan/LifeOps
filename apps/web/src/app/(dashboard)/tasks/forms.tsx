"use client";

import type { Priority, TaskStatus } from "@lifeops/db";
import { Check, LoaderCircle, Pencil, Plus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  completeTaskAction,
  createTaskAction,
  deleteTaskAction,
  type TaskActionState,
  updateTaskAction,
} from "./actions";

const initialState: TaskActionState = {
  ok: true,
  message: "",
};

const statusOptions: TaskStatus[] = ["todo", "in_progress", "done", "archived"];
const priorityOptions: Priority[] = ["low", "medium", "high"];

export type TaskGoalOption = {
  id: string;
  title: string;
  lifeArea: {
    name: string;
  };
};

export type TaskFormValue = {
  id: string;
  goalId: string | null;
  title: string;
  description: string | null;
  dueDate: Date | null;
  priority: Priority;
  status: TaskStatus;
};

export function CreateTaskForm({ goals }: { goals: TaskGoalOption[] }) {
  const [state, action, pending] = useActionState(createTaskAction, initialState);

  return (
    <TaskForm
      action={action}
      goals={goals}
      pending={pending}
      state={state}
      submitLabel="Create task"
      submittingLabel="Creating..."
    />
  );
}

export function NewTaskPanel({ goals }: { goals: TaskGoalOption[] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-md border bg-card p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold">Create a task for one concrete next action.</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Add due dates and linked goals when they help you decide what to do next.
          </p>
        </div>
        <Button onClick={() => setIsOpen((current) => !current)} type="button">
          {isOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {isOpen ? "Close" : "New task"}
        </Button>
      </div>

      {isOpen ? (
        <div className="mt-4 border-t pt-4">
          <CreateTaskForm goals={goals} />
        </div>
      ) : null}
    </div>
  );
}

export function EditTaskForm({
  goals,
  task,
}: {
  goals: TaskGoalOption[];
  task: TaskFormValue;
}) {
  const [state, action, pending] = useActionState(updateTaskAction, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state.ok && state.message === "Task updated.") {
      router.refresh();
    }
  }, [router, state]);

  return (
    <TaskForm
      action={action}
      goals={goals}
      pending={pending}
      state={state}
      submitLabel="Save task"
      submittingLabel="Saving..."
      task={task}
    />
  );
}

export function EditTaskPanel({
  goals,
  task,
}: {
  goals: TaskGoalOption[];
  task: TaskFormValue;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-t pt-4">
      <Button onClick={() => setIsOpen((current) => !current)} type="button" variant="outline">
        {isOpen ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
        {isOpen ? "Close edit" : "Edit task"}
      </Button>
      {isOpen ? (
        <div className="mt-4 rounded-md border bg-muted/30 p-4">
          <EditTaskForm goals={goals} task={task} />
        </div>
      ) : null}
    </div>
  );
}

export function CompleteTaskButton({
  completed,
  taskId,
}: {
  completed: boolean;
  taskId: string;
}) {
  return (
    <form action={completeTaskAction}>
      <input name="taskId" type="hidden" value={taskId} />
      <Button disabled={completed} size="icon" type="submit" variant={completed ? "outline" : "default"} aria-label="Complete task">
        <Check className="h-4 w-4" />
      </Button>
    </form>
  );
}

export function DeleteTaskButton({ taskId }: { taskId: string }) {
  return (
    <form action={deleteTaskAction}>
      <input name="taskId" type="hidden" value={taskId} />
      <Button
        aria-label="Delete task"
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

function TaskForm({
  action,
  goals,
  pending,
  state,
  submitLabel,
  submittingLabel,
  task,
}: {
  action: (formData: FormData) => void;
  goals: TaskGoalOption[];
  pending: boolean;
  state: TaskActionState;
  submitLabel: string;
  submittingLabel: string;
  task?: TaskFormValue;
}) {
  return (
    <form action={action} className="space-y-4">
      {task ? <input name="taskId" type="hidden" value={task.id} /> : null}

      <TextField
        defaultValue={task?.title ?? ""}
        label="Title"
        name="title"
        placeholder="Example: Draft weekly review questions"
        required
      />

      <TextArea
        defaultValue={task?.description ?? ""}
        label="Description"
        name="description"
        placeholder="Example: Turn notes and goal progress into three reflection prompts."
        rows={3}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          defaultValue={task?.goalId ?? ""}
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
          defaultValue={task?.status ?? "todo"}
          label="Status"
          name="status"
          options={statusOptions.map((status) => ({ label: formatOption(status), value: status }))}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          defaultValue={task?.priority ?? "medium"}
          label="Priority"
          name="priority"
          options={priorityOptions.map((priority) => ({ label: formatOption(priority), value: priority }))}
        />
        <TextField defaultValue={formatDateInput(task?.dueDate)} label="Due date" name="dueDate" type="date" />
      </div>

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
  type?: "text" | "date";
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

function FormMessage({ state }: { state: TaskActionState }) {
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
