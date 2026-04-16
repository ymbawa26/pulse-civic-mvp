import { beforeEach, describe, expect, test } from "vitest";

import { getRepository } from "@/lib/data/repository";
import { readDatabase } from "@/lib/data/demo-store";
import { resetDemoDatabase } from "@/tests/helpers/demo-db";

describe("demo repository flows", () => {
  beforeEach(async () => {
    await resetDemoDatabase();
  });

  test("stores a submitted report and generates a match summary", async () => {
    const repository = await getRepository();
    const result = await repository.submitIssue({
      reporterUserId: "user-res-2",
      category: "Housing",
      title: "Repeated leak and mold in Eastline hallways",
      description:
        "Leaks and mold keep returning in Eastline hallways and the property office keeps closing requests without repairs.",
      locationText: "Eastline Terrace area",
      latitude: 40.7605,
      longitude: -74.0025,
      occurrenceDate: "2026-04-14",
      privacyMode: "pseudonymous",
      allowMatching: true,
      allowJoiningActionRoom: true,
      institutionTag: "Eastline Terrace",
      severityLevel: "high",
    });

    const summary = await repository.getMatchSummary(result.reportId);
    expect(summary).not.toBeNull();
    expect(summary?.similarReportsCount).toBeGreaterThan(0);
    expect(summary?.room).not.toBeNull();
    expect(summary?.matches[0]?.scoreBreakdown.semantic).toBeGreaterThan(50);

    const db = await readDatabase();
    expect(db.reports.some((report) => report.id === result.reportId)).toBe(true);
  });

  test("handles a no-match submission without creating a room", async () => {
    const repository = await getRepository();
    const result = await repository.submitIssue({
      reporterUserId: "user-res-2",
      category: "Transportation",
      title: "One-off signage issue at remote station",
      description: "A remote station sign is incorrect, but I have not seen other similar reports in this area.",
      locationText: "Remote station",
      latitude: 40.61,
      longitude: -73.79,
      occurrenceDate: "2026-04-15",
      privacyMode: "anonymous",
      allowMatching: true,
      allowJoiningActionRoom: true,
      institutionTag: "Transit",
      severityLevel: "low",
    });

    const summary = await repository.getMatchSummary(result.reportId);
    expect(summary?.similarReportsCount).toBe(0);
    expect(summary?.room).toBeNull();
  });

  test("marks likely duplicates for moderator awareness", async () => {
    const repository = await getRepository();
    const result = await repository.submitIssue({
      reporterUserId: "user-res-1",
      category: "Housing",
      title: "Repeated mold and ceiling leaks in Eastline Terrace",
      description:
        "Water keeps leaking through the same hallway ceiling and mold is spreading again near the vents this week.",
      locationText: "Eastline Terrace apartments",
      latitude: 40.7591,
      longitude: -74.0042,
      occurrenceDate: "2026-04-03",
      privacyMode: "anonymous",
      allowMatching: true,
      allowJoiningActionRoom: true,
      institutionTag: "Eastline Terrace",
      severityLevel: "high",
    });

    const summary = await repository.getMatchSummary(result.reportId);
    expect(summary?.duplicateOf?.id).toBe("report-housing-1");
  });

  test("enforces room access rules for approved and pending users", async () => {
    const repository = await getRepository();
    const approvedStatus = await repository.joinRoom({
      roomId: "room-campus-1",
      userId: "user-res-1",
      reportId: "report-campus-2",
    });
    expect(approvedStatus).toBe("approved");

    const pendingStatus = await repository.joinRoom({
      roomId: "room-housing-1",
      userId: "user-mod-1",
      reportId: null,
    });
    expect(pendingStatus).toBe("approved");

    const newUser = await repository.createUser({
      email: "new@pulse.local",
      password: "Password123A",
      displayName: "New Resident",
    });
    const restrictedStatus = await repository.joinRoom({
      roomId: "room-housing-1",
      userId: newUser.id,
      reportId: null,
    });
    expect(restrictedStatus).toBe("pending");

    const restrictedRoom = await repository.getRoomDetails("room-housing-1", newUser.id);
    expect(restrictedRoom?.accessible).toBe(false);
  });

  test("hides public clusters until at least two safe reports exist", async () => {
    const repository = await getRepository();
    const patterns = await repository.listPublicPatterns();
    expect(patterns.some((pattern) => pattern.category === "Housing")).toBe(true);
    expect(patterns.some((pattern) => pattern.category === "Consumer Issues")).toBe(false);
  });
});
