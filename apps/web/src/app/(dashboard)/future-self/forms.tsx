"use client";

import { LoaderCircle } from "lucide-react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { addLifeAreaAction, saveFutureSelfAction, updateLifeAreaAction, type ActionState } from "./actions";

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

type FutureSelfFormProps = {
  futureSelf?: {
    title: string;
    description: string | null;
    identityStatement: string;
  } | null;
};

export function FutureSelfForm({ futureSelf }: FutureSelfFormProps) {
  const [state, action, pending] = useActionState(saveFutureSelfAction, initialState);

  return (
    <form action={action} className="space-y-4">
      <TextField
        defaultValue={futureSelf?.title ?? ""}
        label="Future self title"
        name="title"
        placeholder="Example: Calm, healthy founder with deep focus"
        required
      />
      <TextArea
        defaultValue={futureSelf?.description ?? ""}
        helperText="Describe the person you are becoming in plain language."
        label="Description"
        name="description"
        placeholder="Example: I lead my work with clarity, protect my health, keep promises to myself, and make steady progress without burning out."
        rows={4}
      />
      <TextArea
        defaultValue={futureSelf?.identityStatement ?? ""}
        helperText="Start with “I am…” and make it specific enough to guide daily choices."
        label="Identity statement"
        name="identityStatement"
        placeholder="Example: I am a disciplined, peaceful person who builds important things, trains my body, and chooses long-term alignment over short-term comfort."
        required
        rows={4}
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
        helperText="What would this area look like if it matched your future self?"
        label="Vision"
        name="vision"
        placeholder="Example: I wake up with energy, train 4 days a week, eat simply, and sleep on time most nights."
        rows={3}
      />
      <TextArea
        disabled={disabled}
        helperText="Be honest about where things are today."
        label="Current reality"
        name="currentReality"
        placeholder="Example: Sleep is inconsistent, workouts happen 1-2 times a week, and energy dips in the afternoon."
        rows={3}
      />
      <TextArea
        disabled={disabled}
        helperText="Name the main difference between current reality and the vision."
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
  const [state, action, pending] = useActionState(updateLifeAreaAction, initialState);

  return (
    <form action={action} className="space-y-4 rounded-md border bg-muted/40 p-4">
      <input name="lifeAreaId" type="hidden" value={lifeArea.id} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField defaultValue={lifeArea.name} label="Life area name" name="name" required />
        <SelectField defaultValue={lifeArea.type} label="Type" name="type" />
      </div>
      <TextArea defaultValue={lifeArea.vision ?? ""} label="Vision" name="vision" rows={3} />
      <TextArea defaultValue={lifeArea.currentReality ?? ""} label="Current reality" name="currentReality" rows={3} />
      <TextArea defaultValue={lifeArea.gap ?? ""} label="Gap" name="gap" rows={3} />
      <FormMessage state={state} />
      <Button disabled={pending} type="submit" variant="outline">
        {pending ? <PendingLabel label="Updating..." /> : "Update life area"}
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
  disabled,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <label className="block space-y-2 text-sm font-medium">
      <span>{label}</span>
      <input
        className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
        defaultValue={defaultValue}
        disabled={disabled}
        name={name}
        placeholder={placeholder}
        required={required}
        type="text"
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
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  helperText?: string;
  rows: number;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <label className="block space-y-2 text-sm font-medium">
      <span>{label}</span>
      <textarea
        className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm leading-6 outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
        defaultValue={defaultValue}
        disabled={disabled}
        name={name}
        placeholder={placeholder}
        required={required}
        rows={rows}
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
