import { type IssueCategory, type MatchConfidence, type PrivacyMode } from "@/lib/types";

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "Pulse";
export const APP_MODE = process.env.NEXT_PUBLIC_APP_MODE === "supabase" ? "supabase" : "demo";
export const REGION_NAME = process.env.NEXT_PUBLIC_REGION_NAME ?? "Rivergate";
export const MATCH_RADIUS_MILES = Number(process.env.PULSE_MATCH_RADIUS_MILES ?? 2);
export const MATCH_WINDOW_DAYS = Number(process.env.PULSE_MATCH_WINDOW_DAYS ?? 30);
export const MAX_FILE_SIZE_BYTES = Number(process.env.PULSE_MAX_FILE_SIZE_BYTES ?? 750_000);
export const ALLOWED_FILE_TYPES = (
  process.env.PULSE_ALLOWED_FILE_TYPES ??
  "image/jpeg,image/png,image/webp,application/pdf"
)
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

export const ISSUE_CATEGORIES: IssueCategory[] = [
  "Housing",
  "Campus",
  "Public Safety",
  "Local Services",
  "Transportation",
  "Consumer Issues",
  "Accessibility",
  "Other",
];

export const PRIVACY_MODES: PrivacyMode[] = ["anonymous", "pseudonymous", "named"];

export const MATCH_CONFIDENCE_ORDER: MatchConfidence[] = [
  "Strong match",
  "Likely match",
  "Weak match",
];

export const SAFE_ACTION_OPTIONS = [
  {
    id: "document-more-evidence",
    label: "Document more evidence",
    description: "Collect dates, photos, and written observations from affected people.",
  },
  {
    id: "contact-responsible-office",
    label: "Contact responsible office",
    description: "Reach the relevant campus office, landlord, or city department with a clear summary.",
  },
  {
    id: "coordinate-complaint-filing",
    label: "Coordinate complaint filing",
    description: "File aligned complaints through lawful channels so the pattern is harder to dismiss.",
  },
  {
    id: "seek-legal-aid",
    label: "Seek legal aid or tenant support",
    description: "Ask a trusted support group or legal clinic to review the pattern and evidence.",
  },
  {
    id: "request-meeting",
    label: "Request meeting",
    description: "Ask for a meeting with the institution or service owner to review the pattern.",
  },
  {
    id: "prepare-public-statement",
    label: "Prepare public statement",
    description: "Draft a factual, evidence-based statement if the group decides public outreach is appropriate.",
  },
] as const;

export const ROOM_GUIDELINES = [
  "Focus on patterns, systems, and institutions rather than attacking private individuals.",
  "No threats, violence, harassment, or doxxing.",
  "Share only evidence you are comfortable contributing to a private room.",
  "Keep location details approximate unless a moderator asks for more context privately.",
  "Choose lawful next steps and document facts before escalating.",
];

export const EVIDENCE_CHECKLIST = [
  {
    id: "dated-notes",
    label: "Dated notes",
    description: "A short timeline of what happened and when.",
  },
  {
    id: "supporting-media",
    label: "Supporting media",
    description: "Photos, screenshots, or PDF evidence that does not expose private personal information.",
  },
  {
    id: "responsible-office",
    label: "Responsible office identified",
    description: "The office, landlord, department, or provider that can receive a formal complaint.",
  },
] as const;

