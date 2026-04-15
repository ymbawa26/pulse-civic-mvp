import { createClient } from "@supabase/supabase-js";
import { differenceInCalendarDays } from "date-fns";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import {
  APP_MODE,
  APP_NAME,
  EVIDENCE_CHECKLIST,
  MATCH_RADIUS_MILES,
  MATCH_WINDOW_DAYS,
  MAX_FILE_SIZE_BYTES,
  ROOM_GUIDELINES,
  SAFE_ACTION_OPTIONS,
} from "@/lib/constants";
import { approximateLocationLabel, approximateCoordinates } from "@/lib/geo";
import {
  buildMatches,
  findPotentialDuplicate,
  normalizeKeywords,
  summarizeMatchContext,
} from "@/lib/matching";
import { evaluateSafety } from "@/lib/moderation";
import { readDatabase, seedDemoDatabase, writeDatabase } from "@/lib/data/demo-store";
import {
  type ActionRoom,
  type ActionRoomPost,
  type AppRepository,
  type CastVoteInput,
  type CreateUserInput,
  type FlagReportInput,
  type IssueReport,
  type JoinRoomInput,
  type MatchSummary,
  type MembershipStatus,
  type ModerationFlag,
  type ModerationQueueItem,
  type PublicPatternCluster,
  type ReportFlag,
  type RoomDetails,
  type SignInInput,
  type SubmitIssueInput,
  type SubmitIssueResult,
  type UpdateProfileInput,
  type UserProfile,
} from "@/lib/types";
import { compactText, unique } from "@/lib/utils";
import { hashPassword, verifyPassword } from "@/lib/auth/session";

const UPLOAD_DIRECTORY = path.join(process.cwd(), "public", "uploads");

class RepositoryError extends Error {}
class AuthorizationError extends RepositoryError {}
class SafetyError extends RepositoryError {
  constructor(message: string, readonly flags: ModerationFlag[]) {
    super(message);
  }
}

function clusterKey(report: IssueReport) {
  const coarse = approximateCoordinates(report.latitude, report.longitude);
  return `${report.category.toLowerCase()}-${report.institutionTag ? report.institutionTag.toLowerCase() : "local"}-${
    coarse.latitude
  }-${coarse.longitude}`;
}

async function saveEvidenceFile(input: SubmitIssueInput) {
  if (!input.evidenceFileName || !input.evidenceBuffer) {
    return { evidenceFileName: null, evidencePath: null };
  }

  await mkdir(UPLOAD_DIRECTORY, { recursive: true });
  const safeName = `${randomUUID()}-${input.evidenceFileName.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
  const target = path.join(UPLOAD_DIRECTORY, safeName);
  await writeFile(target, input.evidenceBuffer);

  return {
    evidenceFileName: input.evidenceFileName,
    evidencePath: `/uploads/${safeName}`,
  };
}

async function buildRoomFromReport(report: IssueReport, existingRoom: ActionRoom | undefined) {
  if (existingRoom) {
    return existingRoom;
  }

  return {
    id: randomUUID(),
    clusterKey: clusterKey(report),
    title: `${report.category} action room`,
    category: report.category,
    approximateLocationLabel: report.approximateLocationLabel,
    createdAt: new Date().toISOString(),
    summary: `Private coordination space for people reporting recurring ${report.category.toLowerCase()} issues in ${report.approximateLocationLabel}.`,
    reportIds: [],
    guidelines: ROOM_GUIDELINES,
    suggestedActions: SAFE_ACTION_OPTIONS.map((option) => ({ ...option })),
    checklist: EVIDENCE_CHECKLIST.map((item) => ({ ...item })),
  };
}

async function demoRepository(): Promise<AppRepository> {
  await seedDemoDatabase();

  return {
    async createUser(input: CreateUserInput) {
      const db = await readDatabase();
      const existing = db.users.find((user) => user.email.toLowerCase() === input.email.toLowerCase());

      if (existing) {
        throw new RepositoryError("An account with that email already exists.");
      }

      const user: UserProfile = {
        id: randomUUID(),
        email: input.email.toLowerCase(),
        passwordHash: hashPassword(input.password),
        displayName: input.displayName,
        pseudonym: `${input.displayName.split(" ")[0] ?? "Resident"} Neighbor`,
        role: "resident",
        region: "Rivergate",
        createdAt: new Date().toISOString(),
        preferences: {
          homeLabel: "Rivergate",
          emailAlerts: true,
          privacyDefault: "anonymous",
        },
      };

      db.users.push(user);
      await writeDatabase(db);
      return user;
    },

    async authenticateUser(input: SignInInput) {
      const db = await readDatabase();
      const user = db.users.find((candidate) => candidate.email.toLowerCase() === input.email.toLowerCase());

      if (!user) {
        return null;
      }

      return verifyPassword(input.password, user.passwordHash) ? user : null;
    },

    async getUserById(userId: string) {
      const db = await readDatabase();
      return db.users.find((user) => user.id === userId) ?? null;
    },

    async updateProfile(userId: string, input: UpdateProfileInput) {
      const db = await readDatabase();
      const user = db.users.find((candidate) => candidate.id === userId);

      if (!user) {
        throw new AuthorizationError("You need to sign in to update your profile.");
      }

      user.displayName = input.displayName;
      user.pseudonym = input.pseudonym;
      user.preferences.homeLabel = input.homeLabel;
      user.preferences.emailAlerts = input.emailAlerts;
      user.preferences.privacyDefault = input.privacyDefault;

      await writeDatabase(db);
      return user;
    },

    async listUserReports(userId: string) {
      const db = await readDatabase();
      return db.reports
        .filter((report) => report.reporterUserId === userId)
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
    },

    async listUserRooms(userId: string) {
      const db = await readDatabase();
      const approvedRoomIds = db.roomMembers
        .filter((member) => member.userId === userId && member.status === "approved")
        .map((member) => member.roomId);

      return db.rooms.filter((room) => approvedRoomIds.includes(room.id));
    },

    async submitIssue(input: SubmitIssueInput): Promise<SubmitIssueResult> {
      const moderationCheck = evaluateSafety(`${input.title}\n${input.description}`);

      if (moderationCheck.blocked) {
        throw new SafetyError("Pulse blocked this submission because it contains unsafe content.", moderationCheck.flags);
      }

      if (input.evidenceBuffer && input.evidenceBuffer.byteLength > MAX_FILE_SIZE_BYTES) {
        throw new SafetyError("Evidence files must stay under the supported size limit.", [
          {
            type: "unsupported_file",
            message: "The uploaded file exceeded the supported size limit.",
          },
        ]);
      }

      const db = await readDatabase();
      const storedEvidence = await saveEvidenceFile(input);

      const report: IssueReport = {
        id: randomUUID(),
        reporterUserId: input.reporterUserId,
        category: input.category,
        title: compactText(input.title),
        description: compactText(input.description),
        locationText: compactText(input.locationText),
        latitude: input.latitude,
        longitude: input.longitude,
        approximateLocationLabel: approximateLocationLabel(input.locationText, input.latitude, input.longitude),
        createdAt: new Date().toISOString(),
        occurrenceDate: input.occurrenceDate,
        evidenceFileName: storedEvidence.evidenceFileName,
        evidencePath: storedEvidence.evidencePath,
        privacyMode: input.privacyMode,
        allowMatching: input.allowMatching,
        allowJoiningActionRoom: input.allowJoiningActionRoom,
        status: "submitted",
        moderationFlags: moderationCheck.flags,
        institutionTag: input.institutionTag,
        severityLevel: input.severityLevel,
        normalizedKeywords: normalizeKeywords(input.title, input.description, input.institutionTag ?? ""),
        duplicateOfReportId: null,
      };

      const duplicate = findPotentialDuplicate(report, db.reports);
      if (duplicate) {
        report.duplicateOfReportId = duplicate.id;
        report.moderationFlags.push({
          type: "duplicate_report",
          message: "A very similar nearby report already exists. This submission is kept, but noted as a possible duplicate.",
        });
      }

      const matches = buildMatches(report, db.reports.filter((candidate) => candidate.status !== "removed"));
      report.status = matches.length > 0 ? "matched" : report.moderationFlags.length ? "under_review" : "submitted";
      db.reports.push(report);

      const roomCandidate =
        matches.length > 0 && report.allowJoiningActionRoom
          ? db.rooms.find((room) => room.clusterKey === clusterKey(report))
          : undefined;

      if (matches.length > 0 && report.allowJoiningActionRoom) {
        const room = await buildRoomFromReport(report, roomCandidate);
        if (!db.rooms.find((candidate) => candidate.id === room.id)) {
          room.reportIds.push(report.id, ...matches.slice(0, 4).map((match) => match.reportId));
          room.reportIds = unique(room.reportIds);
          db.rooms.push(room);
        } else if (!room.reportIds.includes(report.id)) {
          room.reportIds.push(report.id);
        }
      }

      await writeDatabase(db);
      return { reportId: report.id };
    },

    async getMatchSummary(reportId: string) {
      const db = await readDatabase();
      const report = db.reports.find((candidate) => candidate.id === reportId);

      if (!report) {
        return null;
      }

      const matches = buildMatches(report, db.reports.filter((candidate) => candidate.id !== report.id));
      const recentReports = db.reports.filter((candidate) => {
        if (candidate.category !== report.category) {
          return false;
        }

        const age = differenceInCalendarDays(new Date(report.createdAt), new Date(candidate.createdAt));
        return age >= 0 && age <= 30;
      });

      const room =
        db.rooms.find((candidate) => candidate.reportIds.includes(report.id)) ??
        db.rooms.find((candidate) => candidate.clusterKey === clusterKey(report)) ??
        null;

      const duplicateOf = report.duplicateOfReportId
        ? db.reports.find((candidate) => candidate.id === report.duplicateOfReportId) ?? null
        : null;

      return {
        report,
        matches,
        similarReportsCount: matches.length,
        last7DaysCount: recentReports.filter((candidate) =>
          differenceInCalendarDays(new Date(report.createdAt), new Date(candidate.createdAt)) <= 7,
        ).length,
        last30DaysCount: recentReports.length,
        summary: summarizeMatchContext(matches.length, report.category, MATCH_RADIUS_MILES, MATCH_WINDOW_DAYS),
        room,
        duplicateOf,
      } satisfies MatchSummary;
    },

    async listPublicPatterns() {
      const db = await readDatabase();
      const publicSafeReports = db.reports.filter(
        (report) => report.status !== "removed" && !report.moderationFlags.some((flag) => flag.type === "possible_doxxing"),
      );

      const clusters = new Map<string, IssueReport[]>();

      for (const report of publicSafeReports) {
        const coarse = approximateCoordinates(report.latitude, report.longitude);
        const key = `${report.category}:${report.institutionTag ?? "local"}:${coarse.latitude}:${coarse.longitude}`;
        const existing = clusters.get(key) ?? [];
        existing.push(report);
        clusters.set(key, existing);
      }

      return Array.from(clusters.entries())
        .filter(([, reports]) => reports.length >= 2)
        .map(([key, reports]) => {
          const [category] = key.split(":");
          const approximateLocation =
            reports
              .map((report) => report.approximateLocationLabel)
              .sort((left, right) => left.localeCompare(right))[0] ?? "Local area";
          const last7DaysCount = reports.filter(
            (report) => differenceInCalendarDays(new Date(), new Date(report.createdAt)) <= 7,
          ).length;
          const last30DaysCount = reports.filter(
            (report) => differenceInCalendarDays(new Date(), new Date(report.createdAt)) <= 30,
          ).length;
          const trend = last7DaysCount >= 2 ? "rising" : reports.length >= 3 ? "steady" : "emerging";

          return {
            id: key,
            category: category as PublicPatternCluster["category"],
            approximateLocationLabel: approximateLocation,
            centerLatitude: reports.reduce((sum, report) => sum + report.latitude, 0) / reports.length,
            centerLongitude: reports.reduce((sum, report) => sum + report.longitude, 0) / reports.length,
            reportCount: reports.length,
            last7DaysCount,
            last30DaysCount,
            trend,
            summary: `${reports.length} private reports describe a recurring ${category.toLowerCase()} pattern in ${approximateLocation}.`,
            confidenceNote: `Reported pattern based on ${reports.length} private submissions in the last ${MATCH_WINDOW_DAYS} days.`,
          } satisfies PublicPatternCluster;
        })
        .sort((left, right) => right.reportCount - left.reportCount);
    },

    async getRoomDetails(roomId: string, userId: string | null) {
      const db = await readDatabase();
      const room = db.rooms.find((candidate) => candidate.id === roomId);

      if (!room) {
        return null;
      }

      const membership = userId
        ? db.roomMembers.find((member) => member.roomId === roomId && member.userId === userId) ?? null
        : null;
      const user = userId ? db.users.find((candidate) => candidate.id === userId) ?? null : null;
      const accessible = user?.role === "moderator" || membership?.status === "approved";

      return {
        room,
        members: db.roomMembers.filter((member) => member.roomId === roomId),
        posts: accessible ? db.roomPosts.filter((post) => post.roomId === roomId) : [],
        votes: accessible ? db.roomVotes.filter((vote) => vote.roomId === roomId) : [],
        accessible,
        membershipStatus: membership?.status ?? null,
        evidenceCoverage: room.reportIds.filter((reportId) => {
          const report = db.reports.find((candidate) => candidate.id === reportId);
          return Boolean(report?.evidencePath);
        }).length,
      } satisfies RoomDetails;
    },

    async joinRoom(input: JoinRoomInput) {
      const db = await readDatabase();
      const room = db.rooms.find((candidate) => candidate.id === input.roomId);
      const user = db.users.find((candidate) => candidate.id === input.userId);

      if (!room || !user) {
        throw new AuthorizationError("The room or account could not be found.");
      }

      const existing = db.roomMembers.find(
        (member) => member.roomId === input.roomId && member.userId === input.userId,
      );

      if (existing) {
        return existing.status;
      }

      const eligibleReport = input.reportId
        ? db.reports.find(
            (report) =>
              report.id === input.reportId &&
              report.reporterUserId === input.userId &&
              room.category === report.category &&
              report.allowJoiningActionRoom,
          )
        : db.reports.find(
            (report) =>
              report.reporterUserId === input.userId &&
              report.category === room.category &&
              report.allowJoiningActionRoom,
          );

      const status: MembershipStatus = user.role === "moderator" || eligibleReport ? "approved" : "pending";

      db.roomMembers.push({
        roomId: input.roomId,
        userId: input.userId,
        reportId: eligibleReport?.id ?? null,
        status,
        joinedAt: new Date().toISOString(),
      });

      await writeDatabase(db);
      return status;
    },

    async addRoomPost(input) {
      const db = await readDatabase();
      const member = db.roomMembers.find(
        (candidate) =>
          candidate.roomId === input.roomId &&
          candidate.userId === input.userId &&
          candidate.status === "approved",
      );
      const user = db.users.find((candidate) => candidate.id === input.userId);

      if (!member || !user) {
        throw new AuthorizationError("Only approved room members can post.");
      }

      const safety = evaluateSafety(input.content, { publicFacing: true });
      if (safety.blocked) {
        throw new SafetyError("Pulse blocked this post because it contains unsafe content.", safety.flags);
      }

      const post: ActionRoomPost = {
        id: randomUUID(),
        roomId: input.roomId,
        authorUserId: input.userId,
        authorDisplayName: user.preferences.privacyDefault === "named" ? user.displayName : user.pseudonym,
        content: compactText(input.content),
        createdAt: new Date().toISOString(),
      };

      db.roomPosts.push(post);
      await writeDatabase(db);
      return post;
    },

    async castVote(input: CastVoteInput) {
      const db = await readDatabase();
      const member = db.roomMembers.find(
        (candidate) =>
          candidate.roomId === input.roomId &&
          candidate.userId === input.userId &&
          candidate.status === "approved",
      );

      if (!member) {
        throw new AuthorizationError("Only approved room members can vote.");
      }

      const existing = db.roomVotes.find(
        (candidate) => candidate.roomId === input.roomId && candidate.userId === input.userId,
      );

      if (existing) {
        existing.optionId = input.optionId;
        existing.createdAt = new Date().toISOString();
      } else {
        db.roomVotes.push({
          roomId: input.roomId,
          userId: input.userId,
          optionId: input.optionId,
          createdAt: new Date().toISOString(),
        });
      }

      await writeDatabase(db);
    },

    async flagReport(input: FlagReportInput): Promise<ReportFlag> {
      const db = await readDatabase();
      const flag = {
        id: randomUUID(),
        reportId: input.reportId,
        flaggedByUserId: input.flaggedByUserId,
        reason: compactText(input.reason),
        createdAt: new Date().toISOString(),
        resolvedAt: null,
      };

      db.reportFlags.push(flag);
      const report = db.reports.find((candidate) => candidate.id === input.reportId);
      if (report && report.status !== "removed") {
        report.status = "flagged";
      }

      await writeDatabase(db);
      return flag;
    },

    async listModerationQueue() {
      const db = await readDatabase();
      return db.reports
        .filter((report) => report.status === "under_review" || report.status === "flagged" || report.moderationFlags.length > 0)
        .map((report) => ({
          report,
          flags: report.moderationFlags,
          user: report.reporterUserId ? db.users.find((user) => user.id === report.reporterUserId) ?? null : null,
          reportedByUsers: db.reportFlags.filter((flag) => flag.reportId === report.id).length,
        }))
        .sort((left, right) => right.report.createdAt.localeCompare(left.report.createdAt)) satisfies ModerationQueueItem[];
    },
  };
}

async function supabaseRepository(): Promise<AppRepository> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new RepositoryError("Supabase mode requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }

  createClient(url, serviceRoleKey);
  throw new RepositoryError(
    "Supabase mode is configured for deployment structure, but the current local verification run uses demo mode. Set NEXT_PUBLIC_APP_MODE=demo for local use.",
  );
}

let repositoryPromise: Promise<AppRepository> | null = null;

export async function getRepository() {
  if (!repositoryPromise) {
    repositoryPromise = APP_MODE === "supabase" ? supabaseRepository() : demoRepository();
  }

  return repositoryPromise;
}

export { AuthorizationError, RepositoryError, SafetyError, APP_NAME };
