import { clsx, type ClassValue } from "clsx";
import { format, formatDistanceToNow, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function compactText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function titleCase(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function formatFullDate(value: string) {
  return format(parseISO(value), "MMM d, yyyy");
}

export function formatRelative(value: string) {
  return formatDistanceToNow(parseISO(value), { addSuffix: true });
}

export function toBoolean(value: FormDataEntryValue | null) {
  return value === "true" || value === "on";
}

export function toNumber(value: FormDataEntryValue | null) {
  return typeof value === "string" ? Number(value) : NaN;
}

export function unique<T>(items: T[]) {
  return Array.from(new Set(items));
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

