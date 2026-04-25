"use client";

import { LoaderCircle, Trash2 } from "lucide-react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { createNoteAction, deleteNoteAction, type NoteActionState, updateNoteAction } from "./actions";

const initialState: NoteActionState = {
  ok: true,
  message: "",
};

export type NoteLinkOptions = {
  goals: Array<{ id: string; title: string }>;
  habits: Array<{ id: string; name: string }>;
  tasks: Array<{ id: string; title: string }>;
};

export type NoteFormValue = {
  id: string;
  title: string;
  body: string;
  tags: string[];
  goalId: string | null;
  habitId: string | null;
  taskId: string | null;
  aiSummary: string | null;
};

export function CreateNoteForm({ links }: { links: NoteLinkOptions }) {
  const [state, action, pending] = useActionState(createNoteAction, initialState);

  return (
    <NoteForm
      action={action}
      links={links}
      pending={pending}
      state={state}
      submitLabel="Create note"
      submittingLabel="Creating..."
    />
  );
}

export function EditNoteForm({
  links,
  note,
}: {
  links: NoteLinkOptions;
  note: NoteFormValue;
}) {
  const [state, action, pending] = useActionState(updateNoteAction, initialState);

  return (
    <NoteForm
      action={action}
      links={links}
      note={note}
      pending={pending}
      state={state}
      submitLabel="Save note"
      submittingLabel="Saving..."
    />
  );
}

export function DeleteNoteButton({ noteId }: { noteId: string }) {
  return (
    <form action={deleteNoteAction}>
      <input name="noteId" type="hidden" value={noteId} />
      <Button
        aria-label="Delete note"
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

function NoteForm({
  action,
  links,
  note,
  pending,
  state,
  submitLabel,
  submittingLabel,
}: {
  action: (formData: FormData) => void;
  links: NoteLinkOptions;
  note?: NoteFormValue;
  pending: boolean;
  state: NoteActionState;
  submitLabel: string;
  submittingLabel: string;
}) {
  return (
    <form action={action} className="space-y-4">
      {note ? <input name="noteId" type="hidden" value={note.id} /> : null}

      <TextField
        defaultValue={note?.title ?? ""}
        label="Title"
        name="title"
        placeholder="Example: Weekly energy pattern"
        required
      />

      <label className="block space-y-2 text-sm font-medium">
        <span>Body</span>
        <textarea
          className="min-h-48 w-full resize-y rounded-md border bg-background px-3 py-2 font-mono text-sm leading-6 outline-none transition-colors placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-primary"
          defaultValue={note?.body ?? ""}
          name="body"
          placeholder={"Markdown-friendly notes...\n\n## Observation\n- What happened?\n\n## Insight\n- What does this suggest?\n\n## Next action\n- What will I try?"}
          required
        />
      </label>

      <TextField
        defaultValue={note?.tags.join(", ") ?? ""}
        helperText="Separate tags with commas."
        label="Tags"
        name="tags"
        placeholder="energy, review, focus"
      />

      <div className="grid gap-4 md:grid-cols-3">
        <SelectField
          defaultValue={note?.goalId ?? ""}
          label="Linked goal"
          name="goalId"
          options={[
            { label: "No linked goal", value: "" },
            ...links.goals.map((goal) => ({ label: goal.title, value: goal.id })),
          ]}
        />
        <SelectField
          defaultValue={note?.habitId ?? ""}
          label="Linked habit"
          name="habitId"
          options={[
            { label: "No linked habit", value: "" },
            ...links.habits.map((habit) => ({ label: habit.name, value: habit.id })),
          ]}
        />
        <SelectField
          defaultValue={note?.taskId ?? ""}
          label="Linked task"
          name="taskId"
          options={[
            { label: "No linked task", value: "" },
            ...links.tasks.map((task) => ({ label: task.title, value: task.id })),
          ]}
        />
      </div>

      <TextArea
        defaultValue={note?.aiSummary ?? ""}
        helperText="Placeholder for the MVP note summarization feature."
        label="AI summary placeholder"
        name="aiSummary"
        placeholder="AI-generated summary will appear here after summarization is added."
        rows={3}
      />

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
  helperText,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  helperText?: string;
  required?: boolean;
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
        type="text"
      />
      {helperText ? <span className="block text-xs leading-5 text-muted-foreground">{helperText}</span> : null}
    </label>
  );
}

function TextArea({
  label,
  name,
  defaultValue,
  placeholder,
  helperText,
  rows,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  helperText?: string;
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
      {helperText ? <span className="block text-xs leading-5 text-muted-foreground">{helperText}</span> : null}
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

function FormMessage({ state }: { state: NoteActionState }) {
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
