import { type ButtonHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";

export function buttonStyles(variant: Variant = "primary") {
  return cn(
    "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-60",
    variant === "primary" &&
      "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-strong)]",
    variant === "secondary" &&
      "border border-[var(--color-border)] bg-white text-[var(--color-ink)] hover:bg-[var(--color-surface-strong)]",
    variant === "ghost" && "text-[var(--color-ink)] hover:bg-[var(--color-surface-strong)]",
    variant === "danger" && "bg-[var(--color-danger)] text-white hover:opacity-90",
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

export function Button({ variant = "primary", className, children, ...props }: ButtonProps) {
  return (
    <button className={cn(buttonStyles(variant), className)} {...props}>
      {children}
    </button>
  );
}

