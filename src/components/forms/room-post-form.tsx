"use client";

import { useActionState } from "react";

import { addRoomPostAction } from "@/lib/actions/report";
import { initialFormState } from "@/lib/actions/shared";
import { Button } from "@/components/ui/button";
import { Field, inputClassName } from "@/components/ui/field";
import { FormStatus } from "@/components/forms/form-status";

export function RoomPostForm({ roomId }: { roomId: string }) {
  const [state, formAction, pending] = useActionState(addRoomPostAction, initialFormState);

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="roomId" value={roomId} />
      <Field
        label="Add a factual update"
        hint="Share evidence, timelines, or safe next-step suggestions. Avoid private personal details."
        error={state.fieldErrors?.content?.[0]}
      >
        <textarea className={`${inputClassName()} min-h-28 resize-y`} name="content" />
      </Field>
      <FormStatus state={state} />
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Posting..." : "Post update"}
        </Button>
      </div>
    </form>
  );
}

