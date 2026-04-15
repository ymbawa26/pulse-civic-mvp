import { compactText } from "@/lib/utils";

import { type ModerationFlag } from "./types";

const PHONE_PATTERN = /(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]*)\d{3}[\s.-]?\d{4}/;
const STREET_PATTERN =
  /\b\d{1,5}\s+[a-z0-9.\-'\s]{2,}\s(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|court|ct|boulevard|blvd)\b/i;
const THREAT_PATTERN =
  /\b(kill|attack|shoot|burn|beat|hurt|bomb|destroy them|make them pay|violent retaliation)\b/i;
const HARASSMENT_PATTERN =
  /\b(target them|harass|doxx|publish their home|mob them|stalk|threaten them)\b/i;

export interface ModerationCheckResult {
  blocked: boolean;
  flags: ModerationFlag[];
  warnings: string[];
}

export function evaluateSafety(text: string, { publicFacing = false } = {}): ModerationCheckResult {
  const normalized = compactText(text);
  const flags: ModerationFlag[] = [];
  const warnings: string[] = [];

  if (THREAT_PATTERN.test(normalized)) {
    flags.push({
      type: "violent_language",
      message: "Language suggesting violence or threats is not allowed.",
    });
  }

  if (HARASSMENT_PATTERN.test(normalized)) {
    flags.push({
      type: "harassment",
      message: "Harassment or doxxing prompts are not allowed.",
    });
  }

  if (PHONE_PATTERN.test(normalized)) {
    flags.push({
      type: "phone_number",
      message: "Phone numbers should not be shared in civic coordination spaces.",
    });
  }

  if (publicFacing && STREET_PATTERN.test(normalized)) {
    flags.push({
      type: "unsafe_address",
      message: "Exact addresses are hidden from public-facing areas to protect privacy.",
    });
  }

  if (!flags.length && publicFacing) {
    warnings.push("Public views show approximate locations and reported patterns, not proven facts.");
  }

  return {
    blocked: flags.some((flag) =>
      ["violent_language", "harassment", "phone_number", "unsafe_address"].includes(flag.type),
    ),
    flags,
    warnings,
  };
}

