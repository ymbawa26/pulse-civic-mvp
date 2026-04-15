import { z } from "zod";

import { ISSUE_CATEGORIES, PRIVACY_MODES } from "@/lib/constants";

export const signUpSchema = z.object({
  email: z.email(),
  password: z
    .string()
    .min(10, "Use at least 10 characters.")
    .regex(/[A-Z]/, "Include at least one uppercase letter.")
    .regex(/[0-9]/, "Include at least one number."),
  displayName: z.string().trim().min(2).max(60),
});

export const signInSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const profileSchema = z.object({
  displayName: z.string().trim().min(2).max(60),
  pseudonym: z.string().trim().min(2).max(40),
  homeLabel: z.string().trim().min(2).max(80),
  emailAlerts: z.boolean(),
  privacyDefault: z.enum(PRIVACY_MODES),
});

export const reportSchema = z.object({
  category: z.enum(ISSUE_CATEGORIES),
  title: z.string().trim().min(8).max(120),
  description: z.string().trim().min(20).max(1500),
  locationText: z.string().trim().min(4).max(120),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  occurrenceDate: z.string().min(1),
  privacyMode: z.enum(PRIVACY_MODES),
  allowMatching: z.boolean(),
  allowJoiningActionRoom: z.boolean(),
  institutionTag: z.string().trim().max(80).nullable(),
  severityLevel: z.enum(["low", "medium", "high", "critical"]),
});

export const roomPostSchema = z.object({
  content: z.string().trim().min(3).max(1000),
});

export const flagSchema = z.object({
  reason: z.string().trim().min(8).max(300),
});

