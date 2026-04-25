"use client";

import { LoaderCircle } from "lucide-react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  changePasswordAction,
  type AdminSettingsState,
  updateUserProfileAction,
} from "./actions";

const initialState: AdminSettingsState = {
  ok: true,
  message: "",
};

export function ProfileDetailsForm({
  email,
  name,
  username,
}: {
  email: string;
  name: string | null;
  username: string | null;
}) {
  const [state, action, pending] = useActionState(updateUserProfileAction, initialState);

  return (
    <form action={action} className="space-y-4">
      <TextField defaultValue={email} label="Email" name="email" required type="email" />
      <TextField defaultValue={name ?? ""} label="Name" name="name" placeholder="Your display name" />
      <TextField defaultValue={username ?? ""} label="Username" name="username" placeholder="admin" />
      <FormMessage state={state} />
      <Button disabled={pending} type="submit">
        {pending ? <PendingLabel label="Saving..." /> : "Save profile"}
      </Button>
    </form>
  );
}

export function ChangePasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [state, action, pending] = useActionState(changePasswordAction, initialState);

  return (
    <form action={action} className="space-y-4">
      {hasPassword ? (
        <TextField autoComplete="current-password" label="Current password" name="currentPassword" required type="password" />
      ) : null}
      <TextField autoComplete="new-password" label="New password" name="newPassword" required type="password" />
      <TextField autoComplete="new-password" label="Confirm new password" name="confirmPassword" required type="password" />
      <FormMessage state={state} />
      <Button disabled={pending} type="submit">
        {pending ? <PendingLabel label="Changing..." /> : "Change password"}
      </Button>
    </form>
  );
}

function TextField({
  label,
  name,
  defaultValue,
  placeholder,
  required,
  type = "text",
  autoComplete,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  type?: "text" | "email" | "password";
  autoComplete?: string;
}) {
  return (
    <label className="block space-y-2 text-sm font-medium">
      <span>{label}</span>
      <input
        autoComplete={autoComplete}
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

function PendingLabel({ label }: { label: string }) {
  return (
    <>
      <LoaderCircle className="h-4 w-4 animate-spin" />
      {label}
    </>
  );
}

function FormMessage({ state }: { state: AdminSettingsState }) {
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
