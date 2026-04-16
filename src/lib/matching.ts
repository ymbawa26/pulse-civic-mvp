import { differenceInCalendarDays, parseISO } from "date-fns";

import { scoreNeuralSimilarity } from "@/lib/ai/neural-similarity";
import { MATCH_RADIUS_MILES, MATCH_WINDOW_DAYS } from "@/lib/constants";
import { formatDistance, haversineMiles } from "@/lib/geo";
import { type IssueReport, type MatchCandidate, type MatchConfidence } from "@/lib/types";
import { clamp, compactText, unique } from "@/lib/utils";

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "at",
  "be",
  "for",
  "from",
  "has",
  "have",
  "in",
  "is",
  "it",
  "of",
  "on",
  "or",
  "our",
  "that",
  "the",
  "their",
  "there",
  "this",
  "to",
  "was",
  "were",
  "with",
]);

export function normalizeKeywords(...values: string[]) {
  return unique(
    values
      .flatMap((value) =>
        compactText(value)
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, " ")
          .split(/\s+/)
          .filter((word) => word.length > 2 && !STOP_WORDS.has(word)),
      )
      .sort(),
  );
}

export function keywordOverlap(left: string[], right: string[]) {
  if (!left.length || !right.length) {
    return 0;
  }

  const leftSet = new Set(left);
  const rightSet = new Set(right);
  const intersection = Array.from(leftSet).filter((word) => rightSet.has(word)).length;
  const union = new Set([...leftSet, ...rightSet]).size;
  return intersection / union;
}

export function classifyMatchConfidence(score: number): MatchConfidence | null {
  if (score >= 75) {
    return "Strong match";
  }

  if (score >= 55) {
    return "Likely match";
  }

  if (score >= 35) {
    return "Weak match";
  }

  return null;
}

export function compareReports(source: IssueReport, candidate: IssueReport) {
  if (source.id === candidate.id) {
    return null;
  }

  if (source.category !== candidate.category || !candidate.allowMatching) {
    return null;
  }

  const distanceMiles = haversineMiles(
    source.latitude,
    source.longitude,
    candidate.latitude,
    candidate.longitude,
  );

  if (distanceMiles > MATCH_RADIUS_MILES) {
    return null;
  }

  const keywordScore = keywordOverlap(source.normalizedKeywords, candidate.normalizedKeywords);
  const daysApart = Math.abs(
    differenceInCalendarDays(parseISO(source.occurrenceDate), parseISO(candidate.occurrenceDate)),
  );

  if (daysApart > MATCH_WINDOW_DAYS) {
    return null;
  }

  const distanceScore = clamp((1 - distanceMiles / MATCH_RADIUS_MILES) * 100, 0, 100);
  const timeScore = clamp((1 - daysApart / MATCH_WINDOW_DAYS) * 100, 0, 100);
  const lexicalScore = keywordScore * 100;
  const semanticScore = scoreNeuralSimilarity({
    leftText: `${source.title} ${source.description} ${source.institutionTag ?? ""}`,
    rightText: `${candidate.title} ${candidate.description} ${candidate.institutionTag ?? ""}`,
    keywordScore,
    institutionMatch:
      Boolean(source.institutionTag) &&
      Boolean(candidate.institutionTag) &&
      source.institutionTag?.toLowerCase() === candidate.institutionTag?.toLowerCase(),
    severityMatch: source.severityLevel === candidate.severityLevel,
  });
  const totalScore = distanceScore * 0.3 + timeScore * 0.18 + lexicalScore * 0.22 + semanticScore * 0.3;
  const confidence = classifyMatchConfidence(totalScore);

  if (!confidence) {
    return null;
  }

  const reasoning = [
    `Same ${source.category.toLowerCase()} category`,
    `Reported ${formatDistance(distanceMiles)} away`,
    `${Math.round(keywordScore * 100)}% keyword overlap`,
    `Semantic similarity signal ${Math.round(semanticScore)}% from similar wording and context`,
    `Within ${daysApart} day${daysApart === 1 ? "" : "s"} of the reported occurrence`,
  ];

  if (
    source.institutionTag &&
    candidate.institutionTag &&
    source.institutionTag.toLowerCase() === candidate.institutionTag.toLowerCase()
  ) {
    reasoning.splice(1, 0, "Shared institution or context tag");
  }

  return {
    reportId: candidate.id,
    category: candidate.category,
    title: candidate.title,
    approximateLocationLabel: candidate.approximateLocationLabel,
    occurrenceDate: candidate.occurrenceDate,
    distanceMiles,
    score: Number(totalScore.toFixed(1)),
    confidence,
    reasoning,
    scoreBreakdown: {
      distance: Number(distanceScore.toFixed(1)),
      time: Number(timeScore.toFixed(1)),
      keywords: Number(lexicalScore.toFixed(1)),
      semantic: Number(semanticScore.toFixed(1)),
    },
  } satisfies MatchCandidate;
}

export function buildMatches(report: IssueReport, reports: IssueReport[]) {
  return reports
    .map((candidate) => compareReports(report, candidate))
    .filter((match): match is MatchCandidate => Boolean(match))
    .sort((left, right) => right.score - left.score);
}

export function findPotentialDuplicate(report: IssueReport, reports: IssueReport[]) {
  return reports.find((candidate) => {
    if (candidate.category !== report.category) {
      return false;
    }

    const distance = haversineMiles(report.latitude, report.longitude, candidate.latitude, candidate.longitude);
    const overlap = keywordOverlap(report.normalizedKeywords, candidate.normalizedKeywords);
    const daysApart = Math.abs(
      differenceInCalendarDays(parseISO(report.occurrenceDate), parseISO(candidate.occurrenceDate)),
    );

    return distance <= 0.35 && overlap >= 0.45 && daysApart <= 7;
  });
}

export function summarizeMatchContext(matchCount: number, category: string, radiusMiles: number, days: number) {
  if (matchCount === 0) {
    return `No similar ${category.toLowerCase()} reports were found within ${radiusMiles} miles in the last ${days} days.`;
  }

  return `Matched because ${matchCount} similar ${category.toLowerCase()} report${
    matchCount === 1 ? " was" : "s were"
  } submitted within ${radiusMiles} miles in the last ${days} days.`;
}
