import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "accent" | "warning" | "danger" | "success";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        tone === "neutral" && "bg-[var(--color-surface-strong)] text-[var(--color-ink-muted)]",
        tone === "accent" && "bg-[var(--color-accent-soft)] text-[var(--color-accent-strong)]",
        tone === "warning" && "bg-[#fff3dc] text-[#8f5d04]",
        tone === "danger" && "bg-[#fde7e7] text-[#8b2525]",
        tone === "success" && "bg-[#e3f7ee] text-[#166647]",
      )}
    >
      {children}
    </span>
  );
}

