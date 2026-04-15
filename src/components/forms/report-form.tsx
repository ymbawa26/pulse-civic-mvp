"use client";

import { useActionState } from "react";

import { ISSUE_CATEGORIES, PRIVACY_MODES } from "@/lib/constants";
import { submitIssueAction } from "@/lib/actions/report";
import { initialFormState } from "@/lib/actions/shared";
import { type UserProfile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Field, inputClassName } from "@/components/ui/field";
import { FormStatus } from "@/components/forms/form-status";

export function ReportForm({ user }: { user: UserProfile | null }) {
  const [state, formAction, pending] = useActionState(submitIssueAction, initialFormState);

  return (
    <form action={formAction} className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Issue category" error={state.fieldErrors?.category?.[0]}>
          <select className={inputClassName()} name="category" defaultValue="Housing">
            {ISSUE_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Severity" hint="Use critical only for immediate safety risks." error={state.fieldErrors?.severityLevel?.[0]}>
          <select className={inputClassName()} name="severityLevel" defaultValue="medium">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </Field>
      </div>

      <Field label="Short title" hint="Keep it factual and easy to scan." error={state.fieldErrors?.title?.[0]}>
        <input className={inputClassName()} name="title" placeholder="Repeated mold and repair delays in my building" />
      </Field>

      <Field
        label="What happened?"
        hint="Describe the recurring issue, when it happens, and any evidence you already have."
        error={state.fieldErrors?.description?.[0]}
      >
        <textarea className={`${inputClassName()} min-h-36 resize-y`} name="description" />
      </Field>

      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Approximate location"
          hint="Use a building, corridor, intersection, or campus landmark rather than a private home address."
          error={state.fieldErrors?.locationText?.[0]}
        >
          <input className={inputClassName()} name="locationText" placeholder="Eastline Terrace area" />
        </Field>
        <Field label="Institution or context tag" hint="Optional: landlord, campus office, transit agency, service provider.">
          <input className={inputClassName()} name="institutionTag" placeholder="Rivergate University" />
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Latitude" hint="Approximate coordinates are enough." error={state.fieldErrors?.latitude?.[0]}>
          <input className={inputClassName()} name="latitude" type="number" step="0.0001" defaultValue="40.759" />
        </Field>
        <Field label="Longitude" error={state.fieldErrors?.longitude?.[0]}>
          <input className={inputClassName()} name="longitude" type="number" step="0.0001" defaultValue="-74.004" />
        </Field>
        <Field label="Occurrence date" error={state.fieldErrors?.occurrenceDate?.[0]}>
          <input className={inputClassName()} name="occurrenceDate" type="date" />
        </Field>
      </div>

      <Field label="Evidence file" hint="Optional. JPG, PNG, WEBP, or PDF under 750 KB.">
        <input className={inputClassName()} name="evidence" type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" />
      </Field>

      <Field label="Privacy mode" error={state.fieldErrors?.privacyMode?.[0]}>
        <select
          className={inputClassName()}
          name="privacyMode"
          defaultValue={user?.preferences.privacyDefault ?? "anonymous"}
        >
          {PRIVACY_MODES.map((mode) => (
            <option key={mode} value={mode}>
              {mode}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid gap-3 rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm text-[var(--color-ink)]">
        <label className="flex items-start gap-3">
          <input type="checkbox" name="allowMatching" defaultChecked className="mt-1 size-4" />
          <span>Allow Pulse to privately compare this report with similar nearby reports.</span>
        </label>
        <label className="flex items-start gap-3">
          <input type="checkbox" name="allowJoiningActionRoom" defaultChecked className="mt-1 size-4" />
          <span>Allow Pulse to offer a private action room if a safe match cluster exists.</span>
        </label>
      </div>

      <div className="rounded-[24px] border border-[#f0dfc0] bg-[#fff8ee] p-4 text-sm text-[#7d5a12]">
        Pulse does not automatically verify every claim. Please report facts, avoid naming private individuals, and do not include threats, phone numbers, or exact home addresses in public-facing content.
      </div>

      <FormStatus state={state} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[var(--color-ink-muted)]">
          Most people can finish this in under two minutes.
        </p>
        <Button type="submit" disabled={pending}>
          {pending ? "Submitting..." : "Submit private report"}
        </Button>
      </div>
    </form>
  );
}

