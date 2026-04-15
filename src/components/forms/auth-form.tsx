"use client";

import Link from "next/link";
import { useActionState } from "react";

import { signInAction, signUpAction } from "@/lib/actions/auth";
import { initialFormState } from "@/lib/actions/shared";
import { Button } from "@/components/ui/button";
import { Field, inputClassName } from "@/components/ui/field";
import { FormStatus } from "@/components/forms/form-status";

export function AuthForm({
  mode,
  next = "/profile",
}: {
  mode: "sign-in" | "sign-up";
  next?: string;
}) {
  const action = mode === "sign-in" ? signInAction : signUpAction;
  const [state, formAction, pending] = useActionState(action, initialFormState);

  return (
    <form action={formAction} className="grid gap-5">
      <input type="hidden" name="next" value={next} />
      {mode === "sign-up" ? (
        <Field label="Full name" error={state.fieldErrors?.displayName?.[0]}>
          <input className={inputClassName()} name="displayName" autoComplete="name" />
        </Field>
      ) : null}
      <Field label="Email" error={state.fieldErrors?.email?.[0]}>
        <input className={inputClassName()} type="email" name="email" autoComplete="email" />
      </Field>
      <Field
        label="Password"
        hint={mode === "sign-up" ? "Use 10+ characters with one uppercase letter and one number." : undefined}
        error={state.fieldErrors?.password?.[0]}
      >
        <input className={inputClassName()} type="password" name="password" autoComplete="current-password" />
      </Field>
      <FormStatus state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? "Please wait..." : mode === "sign-in" ? "Sign in" : "Create account"}
      </Button>
      <p className="text-sm text-[var(--color-ink-muted)]">
        {mode === "sign-in" ? "New to Pulse?" : "Already have an account?"}{" "}
        <Link
          href={mode === "sign-in" ? `/auth/sign-up?next=${encodeURIComponent(next)}` : `/auth/sign-in?next=${encodeURIComponent(next)}`}
          className="font-semibold text-[var(--color-accent-strong)]"
        >
          {mode === "sign-in" ? "Create one" : "Sign in"}
        </Link>
      </p>
    </form>
  );
}

