"use client";

import { type FormState } from "@/lib/actions/shared";

export function FormStatus({ state }: { state: FormState }) {
  if (!state.message) {
    return null;
  }

  return (
    <div
      className={
        state.status === "error"
          ? "rounded-2xl border border-[#f0c4c4] bg-[#fff3f3] px-4 py-3 text-sm text-[#922c2c]"
          : "rounded-2xl border border-[#b8e0ca] bg-[#effaf4] px-4 py-3 text-sm text-[#166647]"
      }
    >
      {state.message}
    </div>
  );
}

