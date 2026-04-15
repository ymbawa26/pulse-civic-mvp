export type IssueCategory =
  | "Housing"
  | "Campus"
  | "Public Safety"
  | "Local Services"
  | "Transportation"
  | "Consumer Issues"
  | "Accessibility"
  | "Other";

export type PrivacyMode = "anonymous" | "pseudonymous" | "named";
export type ReportStatus = "submitted" | "under_review" | "matched" | "flagged" | "removed";
export type SeverityLevel = "low" | "medium" | "high" | "critical";
export type MatchConfidence = "Strong match" | "Likely match" | "Weak match";
export type MemberRole = "resident" | "moderator";
export type MembershipStatus = "approved" | "pending";
export type ModerationFlagType =
  | "possible_doxxing"
  | "violent_language"
  | "harassment"
  | "phone_number"
  | "unsafe_address"
  | "duplicate_report"
  | "unsupported_file";

export type TrendDirection = "emerging" | "steady" | "rising";

export interface UserPreferences {
  homeLabel: string;
  emailAlerts: boolean;
  privacyDefault: PrivacyMode;
}

export interface UserProfile {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  pseudonym: string;
  role: MemberRole;
  region: string;
  createdAt: string;
  preferences: UserPreferences;
}

export interface ModerationFlag {
  type: ModerationFlagType;
  message: string;
}

export interface IssueReport {
  id: string;
  reporterUserId: string | null;
  category: IssueCategory;
  title: string;
  description: string;
  locationText: string;
  latitude: number;
  longitude: number;
  approximateLocationLabel: string;
  createdAt: string;
  occurrenceDate: string;
  evidenceFileName: string | null;
  evidencePath: string | null;
  privacyMode: PrivacyMode;
  allowMatching: boolean;
  allowJoiningActionRoom: boolean;
  status: ReportStatus;
  moderationFlags: ModerationFlag[];
  institutionTag: string | null;
  severityLevel: SeverityLevel;
  normalizedKeywords: string[];
  duplicateOfReportId: string | null;
}

export interface MatchCandidate {
  reportId: string;
  category: IssueCategory;
  title: string;
  approximateLocationLabel: string;
  occurrenceDate: string;
  distanceMiles: number;
  score: number;
  confidence: MatchConfidence;
  reasoning: string[];
}

export interface MatchSummary {
  report: IssueReport;
  matches: MatchCandidate[];
  similarReportsCount: number;
  last7DaysCount: number;
  last30DaysCount: number;
  summary: string;
  room: ActionRoom | null;
  duplicateOf: IssueReport | null;
}

export interface RoomChecklistItem {
  id: string;
  label: string;
  description: string;
}

export interface ActionRoom {
  id: string;
  clusterKey: string;
  title: string;
  category: IssueCategory;
  approximateLocationLabel: string;
  createdAt: string;
  summary: string;
  reportIds: string[];
  guidelines: string[];
  suggestedActions: ActionRoomVoteOption[];
  checklist: RoomChecklistItem[];
}

export interface ActionRoomMember {
  roomId: string;
  userId: string;
  reportId: string | null;
  status: MembershipStatus;
  joinedAt: string;
}

export interface ActionRoomPost {
  id: string;
  roomId: string;
  authorUserId: string;
  authorDisplayName: string;
  content: string;
  createdAt: string;
}

export interface ActionRoomVoteOption {
  id: string;
  label: string;
  description: string;
}

export interface ActionRoomVote {
  roomId: string;
  userId: string;
  optionId: string;
  createdAt: string;
}

export interface ReportFlag {
  id: string;
  reportId: string;
  flaggedByUserId: string | null;
  reason: string;
  createdAt: string;
  resolvedAt: string | null;
}

export interface ModerationEvent {
  id: string;
  reportId: string;
  moderatorUserId: string;
  action: "approved" | "removed" | "needs_review";
  note: string;
  createdAt: string;
}

export interface PublicPatternCluster {
  id: string;
  category: IssueCategory;
  approximateLocationLabel: string;
  centerLatitude: number;
  centerLongitude: number;
  reportCount: number;
  last7DaysCount: number;
  last30DaysCount: number;
  trend: TrendDirection;
  summary: string;
  confidenceNote: string;
}

export interface RoomDetails {
  room: ActionRoom;
  members: ActionRoomMember[];
  posts: ActionRoomPost[];
  votes: ActionRoomVote[];
  accessible: boolean;
  membershipStatus: MembershipStatus | null;
  evidenceCoverage: number;
}

export interface ModerationQueueItem {
  report: IssueReport;
  flags: ModerationFlag[];
  user: UserProfile | null;
  reportedByUsers: number;
}

export interface DatabaseState {
  users: UserProfile[];
  reports: IssueReport[];
  rooms: ActionRoom[];
  roomMembers: ActionRoomMember[];
  roomPosts: ActionRoomPost[];
  roomVotes: ActionRoomVote[];
  reportFlags: ReportFlag[];
  moderationEvents: ModerationEvent[];
}

export interface CreateUserInput {
  email: string;
  password: string;
  displayName: string;
}

export interface SignInInput {
  email: string;
  password: string;
}

export interface UpdateProfileInput {
  displayName: string;
  pseudonym: string;
  homeLabel: string;
  emailAlerts: boolean;
  privacyDefault: PrivacyMode;
}

export interface SubmitIssueInput {
  reporterUserId: string | null;
  category: IssueCategory;
  title: string;
  description: string;
  locationText: string;
  latitude: number;
  longitude: number;
  occurrenceDate: string;
  privacyMode: PrivacyMode;
  allowMatching: boolean;
  allowJoiningActionRoom: boolean;
  institutionTag: string | null;
  severityLevel: SeverityLevel;
  evidenceFileName?: string | null;
  evidenceBuffer?: Buffer | null;
  evidenceMimeType?: string | null;
}

export interface JoinRoomInput {
  roomId: string;
  userId: string;
  reportId: string | null;
}

export interface AddRoomPostInput {
  roomId: string;
  userId: string;
  content: string;
}

export interface CastVoteInput {
  roomId: string;
  userId: string;
  optionId: string;
}

export interface FlagReportInput {
  reportId: string;
  flaggedByUserId: string | null;
  reason: string;
}

export interface SubmitIssueResult {
  reportId: string;
}

export interface AppRepository {
  createUser(input: CreateUserInput): Promise<UserProfile>;
  authenticateUser(input: SignInInput): Promise<UserProfile | null>;
  getUserById(userId: string): Promise<UserProfile | null>;
  updateProfile(userId: string, input: UpdateProfileInput): Promise<UserProfile>;
  listUserReports(userId: string): Promise<IssueReport[]>;
  listUserRooms(userId: string): Promise<ActionRoom[]>;
  submitIssue(input: SubmitIssueInput): Promise<SubmitIssueResult>;
  getMatchSummary(reportId: string): Promise<MatchSummary | null>;
  listPublicPatterns(): Promise<PublicPatternCluster[]>;
  getRoomDetails(roomId: string, userId: string | null): Promise<RoomDetails | null>;
  joinRoom(input: JoinRoomInput): Promise<MembershipStatus>;
  addRoomPost(input: AddRoomPostInput): Promise<ActionRoomPost>;
  castVote(input: CastVoteInput): Promise<void>;
  flagReport(input: FlagReportInput): Promise<ReportFlag>;
  listModerationQueue(): Promise<ModerationQueueItem[]>;
}

