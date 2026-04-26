"use client";

import { LoaderCircle, Pencil, RotateCcw, Trash2, X } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  addLifeAreaAction,
  deleteLifeAreaAction,
  saveFutureSelfAction,
  updateLifeAreaAction,
  type ActionState,
} from "./actions";

const initialState: ActionState = {
  ok: true,
  message: "",
};

const lifeAreaTypes = [
  "health",
  "career",
  "relationships",
  "finance",
  "learning",
  "creativity",
  "spirituality",
  "home",
  "other",
];

export type FutureSelfProfileDraft = {
  title: string;
  description: string;
  identityStatement: string;
};

type FutureSelfFormProps = {
  futureSelf?: {
    title: string;
    description: string | null;
    identityStatement: string;
  } | null;
  draft?: FutureSelfProfileDraft | null;
  onRevertDraft?: () => void;
};

export function FutureSelfForm({ draft, futureSelf, onRevertDraft }: FutureSelfFormProps) {
  const [state, action, pending] = useActionState(saveFutureSelfAction, initialState);
  const [values, setValues] = useState<FutureSelfProfileDraft>(() => toProfileDraft(futureSelf));

  useEffect(() => {
    setValues(draft ?? toProfileDraft(futureSelf));
  }, [draft, futureSelf]);

  return (
    <form action={action} className="space-y-4">
      {draft ? (
        <div className="flex flex-col gap-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
          <span>AI draft is staged in this form. Save it to keep it, or revert to your current profile.</span>
          <Button className="border-amber-300 bg-white hover:bg-amber-100" onClick={onRevertDraft} type="button" variant="outline">
            <RotateCcw className="h-4 w-4" />
            Revert profile
          </Button>
        </div>
      ) : null}

      <TextField
        label="Future self title"
        name="title"
        onChange={(value) => setValues((current) => ({ ...current, title: value }))}
        placeholder="Example: Calm, healthy founder with deep focus"
        required
        value={values.title}
      />
      <TextArea
        helperText="Use this as the longer profile summary: what your future life looks like, what matters to you, and the kind of outcomes you are building toward. Example: I run a focused workday, protect family time, train consistently, and make steady progress on meaningful projects without burning out."
        label="Description"
        name="description"
        onChange={(value) => setValues((current) => ({ ...current, description: value }))}
        placeholder="Example: I lead my work with clarity, protect my health, keep promises to myself, and make steady progress without burning out."
        rows={4}
        value={values.description}
      />
      <TextArea
        helperText='Use this as a short first-person belief or identity anchor, usually one sentence starting with "I am..." It should guide daily decisions. Example: "I am a calm, disciplined builder who keeps promises to myself and chooses focused progress over distraction."'
        label="Identity statement"
        name="identityStatement"
        onChange={(value) => setValues((current) => ({ ...current, identityStatement: value }))}
        placeholder="Example: I am a disciplined, peaceful person who builds important things, trains my body, and chooses long-term alignment over short-term comfort."
        required
        rows={4}
        value={values.identityStatement}
      />
      <FormMessage state={state} />
      <Button disabled={pending} type="submit">
        {pending ? <PendingLabel label="Saving..." /> : futureSelf ? "Save profile" : "Create profile"}
      </Button>
    </form>
  );
}

export function AddLifeAreaForm({ disabled }: { disabled: boolean }) {
  const [state, action, pending] = useActionState(addLifeAreaAction, initialState);

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField disabled={disabled} label="Life area name" name="name" placeholder="Example: Health and energy" required />
        <SelectField defaultValue="health" disabled={disabled} label="Type" name="type" />
      </div>
      <TextArea
        disabled={disabled}
        helperText="Describe the ideal future state for this life area. This is where you want to be, not where you are today."
        label="Vision"
        name="vision"
        placeholder="Example: I wake up with energy, train 4 days a week, eat simply, and sleep on time most nights."
        rows={3}
      />
      <TextArea
        disabled={disabled}
        helperText="Describe what is currently true in this area. Include your real habits, constraints, strengths, and problems today."
        label="Current reality"
        name="currentReality"
        placeholder="Example: Sleep is inconsistent, workouts happen 1-2 times a week, and energy dips in the afternoon."
        rows={3}
      />
      <TextArea
        disabled={disabled}
        helperText="Describe the gap between your current reality and your vision. This helps LifeOps suggest useful goals and next actions."
        label="Gap"
        name="gap"
        placeholder="Example: I need a repeatable evening routine, planned workouts, and fewer late-night work sessions."
        rows={3}
      />
      <FormMessage state={state} />
      <Button disabled={disabled || pending} type="submit">
        {pending ? <PendingLabel label="Adding..." /> : "Add life area"}
      </Button>
    </form>
  );
}

export function EditLifeAreaForm({
  lifeArea,
}: {
  lifeArea: {
    id: string;
    name: string;
    type: string;
    vision: string | null;
    currentReality: string | null;
    gap: string | null;
  };
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [state, action, pending] = useActionState(updateLifeAreaAction, initialState);
  const [deleteState, deleteAction, isDeleting] = useActionState(deleteLifeAreaAction, initialState);

  return (
    <div className="space-y-4 rounded-md border bg-card p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-base font-semibold">{lifeArea.name}</h4>
            <span className="rounded-md border bg-muted/60 px-2 py-1 text-xs capitalize text-muted-foreground">
              {lifeArea.type}
            </span>
          </div>
          <SummaryBlock label="Vision" value={lifeArea.vision} />
          <SummaryBlock label="Current reality" value={lifeArea.currentReality} />
          <SummaryBlock label="Gap" value={lifeArea.gap} />
        </div>
        <Button onClick={() => setIsEditing((current) => !current)} type="button" variant="outline">
          {isEditing ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
          {isEditing ? "Close" : "Edit"}
        </Button>
      </div>

      {isEditing ? (
        <div className="border-t pt-4">
          <form action={action} className="space-y-4">
            <input name="lifeAreaId" type="hidden" value={lifeArea.id} />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField defaultValue={lifeArea.name} label="Life area name" name="name" required />
              <SelectField defaultValue={lifeArea.type} label="Type" name="type" />
            </div>
            <TextArea
              defaultValue={lifeArea.vision ?? ""}
              helperText="Future state: what this area should look like when it is aligned with your Future Self."
              label="Vision"
              name="vision"
              rows={3}
            />
            <TextArea
              defaultValue={lifeArea.currentReality ?? ""}
              helperText="Today state: what is honestly happening right now, even if it is messy or incomplete."
              label="Current reality"
              name="currentReality"
              rows={3}
            />
            <TextArea
              defaultValue={lifeArea.gap ?? ""}
              helperText="Difference: what must change between today and the future state."
              label="Gap"
              name="gap"
              rows={3}
            />
            <FormMessage state={state} />
            <Button disabled={pending} type="submit" variant="outline">
              {pending ? <PendingLabel label="Updating..." /> : "Update life area"}
            </Button>
          </form>

          <form action={deleteAction} className="mt-4 border-t pt-4">
            <input name="lifeAreaId" type="hidden" value={lifeArea.id} />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-5 text-muted-foreground">
                Removes this life area from active views while keeping the record in the database.
              </p>
              <Button className="border-red-200 text-red-700 hover:bg-red-50" disabled={isDeleting} type="submit" variant="outline">
                {isDeleting ? (
                  <PendingLabel label="Removing..." />
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Remove life area
                  </>
                )}
              </Button>
            </div>
            <FormMessage state={deleteState} />
          </form>
        </div>
      ) : null}
    </div>
  );
}

function SummaryBlock({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="mt-3">
      <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{value || "Not defined yet."}</p>
    </div>
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
  disabled,
  value,
  onChange,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  value?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <label className="block space-y-2 text-sm font-medium">
      <span>{label}</span>
      <input
        className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
        defaultValue={defaultValue}
        disabled={disabled}
        name={name}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        placeholder={placeholder}
        required={required}
        type="text"
        value={value}
      />
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
  required,
  disabled,
  value,
  onChange,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  helperText?: string;
  rows: number;
  required?: boolean;
  disabled?: boolean;
  value?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <label className="block space-y-2 text-sm font-medium">
      <span>{label}</span>
      <textarea
        className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm leading-6 outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
        defaultValue={defaultValue}
        disabled={disabled}
        name={name}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        placeholder={placeholder}
        required={required}
        rows={rows}
        value={value}
      />
      {helperText ? <span className="block text-xs leading-5 text-muted-foreground">{helperText}</span> : null}
    </label>
  );
}

function SelectField({
  label,
  name,
  defaultValue = "other",
  disabled,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  disabled?: boolean;
}) {
  return (
    <label className="block space-y-2 text-sm font-medium">
      <span>{label}</span>
      <select
        className="h-10 w-full rounded-md border bg-background px-3 text-sm capitalize outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
        defaultValue={defaultValue}
        disabled={disabled}
        name={name}
      >
        {lifeAreaTypes.map((type) => (
          <option key={type} value={type}>
            {type.replace("_", " ")}
          </option>
        ))}
      </select>
    </label>
  );
}

function FormMessage({ state }: { state: ActionState }) {
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

function toProfileDraft(futureSelf: FutureSelfFormProps["futureSelf"]): FutureSelfProfileDraft {
  return {
    title: futureSelf?.title ?? "",
    description: futureSelf?.description ?? "",
    identityStatement: futureSelf?.identityStatement ?? "",
  };
}
