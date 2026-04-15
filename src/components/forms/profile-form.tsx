"use client";

import { useActionState } from "react";

import { updateProfileAction } from "@/lib/actions/auth";
import { initialFormState } from "@/lib/actions/shared";
import { type UserProfile } from "@/lib/types";
import { PRIVACY_MODES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Field, inputClassName } from "@/components/ui/field";
import { FormStatus } from "@/components/forms/form-status";

export function ProfileForm({ user }: { user: UserProfile }) {
  const [state, formAction, pending] = useActionState(updateProfileAction, initialFormState);

  return (
    <form action={formAction} className="grid gap-5">
      <Field label="Display name" error={state.fieldErrors?.displayName?.[0]}>
        <input className={inputClassName()} name="displayName" defaultValue={user.displayName} />
      </Field>
      <Field
        label="Pseudonym"
        hint="Shown in private rooms when you choose anonymous or pseudonymous participation."
        error={state.fieldErrors?.pseudonym?.[0]}
      >
        <input className={inputClassName()} name="pseudonym" defaultValue={user.pseudonym} />
      </Field>
      <Field label="Home label" hint="A general area like North Oak or Rivergate campus." error={state.fieldErrors?.homeLabel?.[0]}>
        <input className={inputClassName()} name="homeLabel" defaultValue={user.preferences.homeLabel} />
      </Field>
      <Field label="Default privacy mode" error={state.fieldErrors?.privacyDefault?.[0]}>
        <select className={inputClassName()} name="privacyDefault" defaultValue={user.preferences.privacyDefault}>
          {PRIVACY_MODES.map((mode) => (
            <option key={mode} value={mode}>
              {mode}
            </option>
          ))}
        </select>
      </Field>
      <label className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-ink)]">
        <input
          type="checkbox"
          name="emailAlerts"
          defaultChecked={user.preferences.emailAlerts}
          className="size-4 rounded border-[var(--color-border)]"
        />
        Email me when a matched room becomes available.
      </label>
      <FormStatus state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save preferences"}
      </Button>
    </form>
  );
}

