import { describe, expect, test } from "vitest";

import { approximateCoordinates, approximateLocationLabel } from "@/lib/geo";
import { evaluateSafety } from "@/lib/moderation";
import { reportSchema, signUpSchema } from "@/lib/validation";

describe("validation and safety", () => {
  test("rejects invalid sign-up input", () => {
    const result = signUpSchema.safeParse({
      email: "not-an-email",
      password: "short",
      displayName: "",
    });

    expect(result.success).toBe(false);
  });

  test("rejects invalid report coordinates", () => {
    const result = reportSchema.safeParse({
      category: "Housing",
      title: "Broken heat for weeks",
      description: "The heat has failed repeatedly for several weeks and management is ignoring requests.",
      locationText: "Eastline Terrace",
      latitude: 100,
      longitude: -74.001,
      occurrenceDate: "2026-04-10",
      privacyMode: "anonymous",
      allowMatching: true,
      allowJoiningActionRoom: true,
      institutionTag: "Eastline Terrace",
      severityLevel: "high",
    });

    expect(result.success).toBe(false);
  });

  test("flags unsafe public-facing content", () => {
    const result = evaluateSafety("Call me at 555-111-2222 and publish 123 Main Street", {
      publicFacing: true,
    });

    expect(result.blocked).toBe(true);
    expect(result.flags.map((flag) => flag.type)).toEqual(
      expect.arrayContaining(["phone_number", "unsafe_address"]),
    );
  });

  test("coarsens map coordinates and hides specific street labels", () => {
    expect(approximateCoordinates(40.7594, -74.0043)).toEqual({
      latitude: 40.76,
      longitude: -74,
    });
    expect(approximateLocationLabel("123 Main Street Apartment 6", 40.75, -74.01)).toContain("local area");
  });
});
