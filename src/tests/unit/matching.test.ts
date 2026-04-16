import { describe, expect, test } from "vitest";

import { buildSeedState } from "@/lib/data/seed";
import {
  buildMatches,
  compareReports,
  findPotentialDuplicate,
  normalizeKeywords,
  summarizeMatchContext,
} from "@/lib/matching";
import { scoreNeuralSimilarity } from "@/lib/ai/neural-similarity";

describe("matching utilities", () => {
  test("returns a strong match for nearby reports with overlapping keywords", () => {
    const { reports } = buildSeedState();
    const source = reports.find((report) => report.id === "report-campus-1");
    const candidate = reports.find((report) => report.id === "report-campus-2");

    expect(source).toBeDefined();
    expect(candidate).toBeDefined();

    const match = compareReports(source!, candidate!);
    expect(match?.confidence).toBe("Likely match");
    expect(match?.reasoning).toContain("Same campus category");
  });

  test("finds a potential duplicate for highly similar nearby reports", () => {
    const { reports } = buildSeedState();
    const source = reports[0];
    const candidate = {
      ...source,
      id: "duplicate-report",
      createdAt: "2026-04-06T10:00:00.000Z",
      occurrenceDate: "2026-04-06",
      normalizedKeywords: normalizeKeywords(source.title, source.description),
    };

    const duplicate = findPotentialDuplicate(candidate, reports);
    expect(duplicate?.id).toBe(source.id);
  });

  test("summarizes empty and non-empty match contexts clearly", () => {
    expect(summarizeMatchContext(0, "Housing", 2, 30)).toContain("No similar housing reports");
    expect(summarizeMatchContext(3, "Housing", 2, 30)).toContain("3 similar housing reports");
  });

  test("buildMatches sorts the strongest candidate first", () => {
    const { reports } = buildSeedState();
    const source = reports.find((report) => report.id === "report-housing-1")!;
    const matches = buildMatches(source, reports);

    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].reportId).toBe("report-housing-2");
  });

  test("neural similarity scores paraphrases higher than unrelated reports", () => {
    const similarScore = scoreNeuralSimilarity({
      leftText: "Repeated mold and leaks in an apartment hallway after ignored maintenance requests",
      rightText: "Tenants keep reporting water damage and mold in the same building corridor with no repairs",
      keywordScore: 0.38,
      institutionMatch: true,
      severityMatch: true,
    });

    const unrelatedScore = scoreNeuralSimilarity({
      leftText: "Repeated mold and leaks in an apartment hallway after ignored maintenance requests",
      rightText: "Students were overcharged a hidden fee at checkout for a campus event ticket",
      keywordScore: 0.04,
      institutionMatch: false,
      severityMatch: false,
    });

    expect(similarScore).toBeGreaterThan(unrelatedScore);
    expect(similarScore).toBeGreaterThan(55);
  });
});
