import { randomUUID } from "crypto";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, gt, gte, lte, or, sql } from "drizzle-orm";
import { z } from "zod";
import {
  learningActivitySessions,
  organizationMembers,
  organizations,
  teamFlexLicences,
  trainingAttestations,
} from "../../drizzle/schema";
import { courseKeyToLabel, getCourseByKey, resolveCourseKey } from "../../shared/courseRegistry";
import { normalizeEmail } from "../_core/access";
import { assertAccess, identityEmail, resolveVerifiedIdentity } from "../_core/accessService";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { resolveOrgManager } from "./orgRouter";
import {
  ACTIVITY_LABELS,
  canonicalSnapshotDigest,
  sessionsToCsv,
  summarizeTrainingSessions,
} from "../trainingRecords";

const activityType = z.enum(["quiz", "mock_exam", "flashcards", "process_guide", "ai_tutor"]);
const periodInput = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  courseKey: z.string().max(64).optional(),
}).optional();

function requireIdentity(ctx: Parameters<typeof resolveVerifiedIdentity>[0]) {
  const identity = resolveVerifiedIdentity(ctx);
  const email = identityEmail(identity);
  if (!email) throw new TRPCError({ code: "UNAUTHORIZED", message: "Sign in to record or view training hours." });
  return { identity, email: normalizeEmail(email), userId: identity.type === "oauth" ? identity.userId : null };
}

function canonicalCourseKey(input: string): string {
  const canonical = resolveCourseKey(input);
  if (!canonical || !getCourseByKey(canonical.courseKey)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Unknown course." });
  }
  return canonical.courseKey;
}

function periodBounds(input?: z.infer<typeof periodInput>) {
  const to = input?.to ?? new Date();
  const from = input?.from ?? new Date(to.getTime() - 365 * 24 * 60 * 60 * 1000);
  if (from.getTime() > to.getTime()) throw new TRPCError({ code: "BAD_REQUEST", message: "Start date must be before end date." });
  if (to.getTime() - from.getTime() > 5 * 365 * 24 * 60 * 60 * 1000) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Reports are limited to five years at a time." });
  }
  return { from, to };
}

async function resolveTrainingOwnership(email: string, userId: number | null, courseKey: string) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  const now = new Date();

  const annualRows = await db.select({
    organizationMemberId: organizationMembers.id,
    orgId: organizationMembers.orgId,
    courseKey: organizationMembers.courseKey,
    courseKeys: organizationMembers.courseKeys,
  }).from(organizationMembers)
    .innerJoin(organizations, eq(organizations.id, organizationMembers.orgId))
    .where(and(
      eq(organizationMembers.email, email),
      eq(organizationMembers.role, "operator"),
      eq(organizationMembers.status, "assigned"),
      or(eq(organizations.status, "active"), eq(organizations.status, "past_due")),
      gt(organizations.termEnd, now),
    )).limit(10);

  for (const row of annualRows) {
    let assigned = row.courseKey ? [row.courseKey] : [];
    try {
      const parsed = row.courseKeys ? JSON.parse(row.courseKeys) : [];
      if (Array.isArray(parsed)) assigned = parsed.filter((value): value is string => typeof value === "string");
    } catch { /* fall back to courseKey */ }
    if (assigned.length === 0 || assigned.some((key) => resolveCourseKey(key)?.courseKey === courseKey)) {
      return { orgId: row.orgId, organizationMemberId: row.organizationMemberId, teamFlexLicenceId: null };
    }
  }

  const flexRows = await db.select({
    id: teamFlexLicences.id,
    organizationId: teamFlexLicences.organizationId,
    courseKey: teamFlexLicences.courseKey,
  }).from(teamFlexLicences).where(and(
    eq(teamFlexLicences.status, "active"),
    lte(teamFlexLicences.startsAt, now),
    gte(teamFlexLicences.accessEndsAt, now),
    or(
      eq(teamFlexLicences.invitedEmail, email),
      ...(userId ? [eq(teamFlexLicences.operatorUserId, userId)] : []),
    ),
  )).limit(20);
  const flex = flexRows.find((row) => resolveCourseKey(row.courseKey)?.courseKey === courseKey);
  return flex
    ? { orgId: flex.organizationId, organizationMemberId: null, teamFlexLicenceId: flex.id }
    : { orgId: null, organizationMemberId: null, teamFlexLicenceId: null };
}

async function getOwnedSession(sessionKey: string, email: string) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  const [row] = await db.select().from(learningActivitySessions)
    .where(and(eq(learningActivitySessions.sessionKey, sessionKey), eq(learningActivitySessions.studentEmail, email))).limit(1);
  if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Training session not found." });
  return { db, row };
}

const heartbeatInput = z.object({
  sessionKey: z.string().uuid(),
  sequence: z.number().int().positive().max(1000000),
  activeSeconds: z.number().int().min(0).max(45),
  unitsCompleted: z.number().int().min(0).max(1000000).default(0),
  topic: z.string().trim().max(128).optional(),
  score: z.number().int().min(0).max(1000000).optional(),
  total: z.number().int().positive().max(1000000).optional(),
});

export const trainingRouter = router({
  start: publicProcedure.input(z.object({
    sessionKey: z.string().uuid(),
    courseKey: z.string().min(1).max(64),
    activityType,
    topic: z.string().trim().max(128).optional(),
  })).mutation(async ({ ctx, input }) => {
    const { email, userId } = requireIdentity(ctx);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const courseKey = canonicalCourseKey(input.courseKey);
    await assertAccess(ctx, courseKey);
    const [existing] = await db.select({ email: learningActivitySessions.studentEmail })
      .from(learningActivitySessions).where(eq(learningActivitySessions.sessionKey, input.sessionKey)).limit(1);
    if (existing) {
      if (existing.email !== email) throw new TRPCError({ code: "CONFLICT", message: "Session key is already in use." });
      return { tracking: true, sessionKey: input.sessionKey };
    }
    const owner = await resolveTrainingOwnership(email, userId, courseKey);
    await db.insert(learningActivitySessions).values({
      sessionKey: input.sessionKey,
      userId,
      studentEmail: email,
      ...owner,
      courseKey,
      activityType: input.activityType,
      topic: input.topic || null,
    });
    return { tracking: true, sessionKey: input.sessionKey };
  }),

  heartbeat: publicProcedure.input(heartbeatInput).mutation(async ({ ctx, input }) => {
    const { email } = requireIdentity(ctx);
    const { db } = await getOwnedSession(input.sessionKey, email);
    await db.update(learningActivitySessions).set({
      activeSeconds: sql`LEAST(${learningActivitySessions.activeSeconds} + ${input.activeSeconds}, TIMESTAMPDIFF(SECOND, ${learningActivitySessions.startedAt}, NOW()))`,
      lastSequence: input.sequence,
      lastHeartbeatAt: new Date(),
      unitsCompleted: sql`GREATEST(${learningActivitySessions.unitsCompleted}, ${input.unitsCompleted})`,
      ...(input.topic ? { topic: input.topic } : {}),
    }).where(and(
      eq(learningActivitySessions.sessionKey, input.sessionKey),
      eq(learningActivitySessions.studentEmail, email),
      eq(learningActivitySessions.status, "active"),
      sql`${learningActivitySessions.lastSequence} < ${input.sequence}`,
    ));
    return { recorded: true };
  }),

  complete: publicProcedure.input(heartbeatInput).mutation(async ({ ctx, input }) => {
    const { email } = requireIdentity(ctx);
    const { db, row } = await getOwnedSession(input.sessionKey, email);
    if (row.status === "completed") return { completed: true };
    await db.update(learningActivitySessions).set({
      activeSeconds: sql`LEAST(${learningActivitySessions.activeSeconds} + ${input.activeSeconds}, TIMESTAMPDIFF(SECOND, ${learningActivitySessions.startedAt}, NOW()))`,
      lastSequence: input.sequence,
      lastHeartbeatAt: new Date(),
      unitsCompleted: sql`GREATEST(${learningActivitySessions.unitsCompleted}, ${input.unitsCompleted})`,
      ...(input.topic ? { topic: input.topic } : {}),
      score: input.score ?? null,
      total: input.total ?? null,
      status: "completed",
      completedAt: new Date(),
    }).where(and(
      eq(learningActivitySessions.sessionKey, input.sessionKey),
      eq(learningActivitySessions.studentEmail, email),
      sql`${learningActivitySessions.lastSequence} < ${input.sequence}`,
    ));
    return { completed: true };
  }),

  mySummary: publicProcedure.input(periodInput).query(async ({ ctx, input }) => {
    const { email } = requireIdentity(ctx);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const { from, to } = periodBounds(input);
    const courseKey = input?.courseKey ? canonicalCourseKey(input.courseKey) : null;
    const rows = await db.select().from(learningActivitySessions).where(and(
      eq(learningActivitySessions.studentEmail, email),
      gt(learningActivitySessions.activeSeconds, 0),
      gte(learningActivitySessions.startedAt, from),
      lte(learningActivitySessions.startedAt, to),
      ...(courseKey ? [eq(learningActivitySessions.courseKey, courseKey)] : []),
    )).orderBy(desc(learningActivitySessions.startedAt)).limit(5000);
    const attestations = await db.select().from(trainingAttestations)
      .where(eq(trainingAttestations.operatorEmail, email)).orderBy(desc(trainingAttestations.signedAt)).limit(50);
    return { email, from, to, ...summarizeTrainingSessions(rows), sessions: rows, attestations };
  }),

  myCsv: publicProcedure.input(periodInput).query(async ({ ctx, input }) => {
    const { email } = requireIdentity(ctx);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const { from, to } = periodBounds(input);
    const courseKey = input?.courseKey ? canonicalCourseKey(input.courseKey) : null;
    const rows = await db.select().from(learningActivitySessions).where(and(
      eq(learningActivitySessions.studentEmail, email),
      gt(learningActivitySessions.activeSeconds, 0),
      gte(learningActivitySessions.startedAt, from),
      lte(learningActivitySessions.startedAt, to),
      ...(courseKey ? [eq(learningActivitySessions.courseKey, courseKey)] : []),
    )).orderBy(desc(learningActivitySessions.startedAt)).limit(10000);
    return { csv: sessionsToCsv(rows), filename: `echelon-training-hours-${from.toISOString().slice(0, 10)}-${to.toISOString().slice(0, 10)}.csv` };
  }),

  managerSummary: publicProcedure.input(periodInput).query(async ({ ctx, input }) => {
    const { orgId } = await resolveOrgManager(ctx);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const { from, to } = periodBounds(input);
    const filters = and(
      eq(learningActivitySessions.orgId, orgId),
      gt(learningActivitySessions.activeSeconds, 0),
      gte(learningActivitySessions.startedAt, from),
      lte(learningActivitySessions.startedAt, to),
    );
    const operatorGroups = await db.select({
      operatorEmail: learningActivitySessions.studentEmail,
      courseKey: learningActivitySessions.courseKey,
      activeSeconds: sql<number>`COALESCE(SUM(${learningActivitySessions.activeSeconds}), 0)`,
      sessionCount: sql<number>`COUNT(*)`,
      latestAt: sql<Date>`MAX(${learningActivitySessions.startedAt})`,
    }).from(learningActivitySessions).where(filters)
      .groupBy(learningActivitySessions.studentEmail, learningActivitySessions.courseKey);
    const activityGroups = await db.select({
      activityType: learningActivitySessions.activityType,
      activeSeconds: sql<number>`COALESCE(SUM(${learningActivitySessions.activeSeconds}), 0)`,
      sessionCount: sql<number>`COUNT(*)`,
    }).from(learningActivitySessions).where(filters).groupBy(learningActivitySessions.activityType);
    const operators = operatorGroups.map((row) => ({
      operatorEmail: row.operatorEmail,
      courseKey: row.courseKey,
      courseName: courseKeyToLabel(row.courseKey),
      activeSeconds: Number(row.activeSeconds),
      sessionCount: Number(row.sessionCount),
      latestAt: new Date(row.latestAt),
    })).sort((a, b) => b.latestAt.getTime() - a.latestAt.getTime());
    const activeSeconds = operators.reduce((total, row) => total + row.activeSeconds, 0);
    const sessionCount = operators.reduce((total, row) => total + row.sessionCount, 0);
    return {
      from, to, activeSeconds, sessionCount, operators,
      byCourse: [],
      byActivity: activityGroups.map((row) => ({
        activityType: row.activityType,
        label: ACTIVITY_LABELS[row.activityType],
        activeSeconds: Number(row.activeSeconds),
        sessionCount: Number(row.sessionCount),
      })),
    };
  }),

  managerOperatorReport: publicProcedure.input(z.object({
    operatorEmail: z.string().email(), courseKey: z.string().max(64), from: z.coerce.date(), to: z.coerce.date(),
  })).query(async ({ ctx, input }) => {
    const { orgId } = await resolveOrgManager(ctx);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const email = normalizeEmail(input.operatorEmail);
    const courseKey = canonicalCourseKey(input.courseKey);
    const { from, to } = periodBounds(input);
    const rows = await db.select().from(learningActivitySessions).where(and(
      eq(learningActivitySessions.orgId, orgId), eq(learningActivitySessions.studentEmail, email),
      gt(learningActivitySessions.activeSeconds, 0),
      eq(learningActivitySessions.courseKey, courseKey), gte(learningActivitySessions.startedAt, from), lte(learningActivitySessions.startedAt, to),
    )).orderBy(desc(learningActivitySessions.startedAt)).limit(10000);
    const [member] = await db.select({ name: organizationMembers.name }).from(organizationMembers)
      .where(and(eq(organizationMembers.orgId, orgId), eq(organizationMembers.email, email))).limit(1);
    const attestations = await db.select().from(trainingAttestations).where(and(
      eq(trainingAttestations.orgId, orgId), eq(trainingAttestations.operatorEmail, email),
      eq(trainingAttestations.courseKey, courseKey), gte(trainingAttestations.periodStart, from), lte(trainingAttestations.periodEnd, to),
    )).orderBy(desc(trainingAttestations.signedAt)).limit(20);
    return { operatorEmail: email, operatorName: member?.name ?? null, courseKey, from, to, ...summarizeTrainingSessions(rows), sessions: rows, attestations };
  }),

  managerCsv: publicProcedure.input(z.object({
    operatorEmail: z.string().email(), courseKey: z.string().max(64), from: z.coerce.date(), to: z.coerce.date(),
  })).query(async ({ ctx, input }) => {
    const { orgId } = await resolveOrgManager(ctx);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const email = normalizeEmail(input.operatorEmail);
    const courseKey = canonicalCourseKey(input.courseKey);
    const { from, to } = periodBounds(input);
    const rows = await db.select().from(learningActivitySessions).where(and(
      eq(learningActivitySessions.orgId, orgId), eq(learningActivitySessions.studentEmail, email),
      gt(learningActivitySessions.activeSeconds, 0),
      eq(learningActivitySessions.courseKey, courseKey), gte(learningActivitySessions.startedAt, from), lte(learningActivitySessions.startedAt, to),
    )).orderBy(desc(learningActivitySessions.startedAt)).limit(10000);
    return { csv: sessionsToCsv(rows), filename: `${email.replace(/[^a-z0-9]+/gi, "-")}-training-hours.csv` };
  }),

  attest: publicProcedure.input(z.object({
    operatorEmail: z.string().email(),
    courseKey: z.string().max(64),
    from: z.coerce.date(),
    to: z.coerce.date(),
    providerName: z.string().trim().min(2).max(200).default("Echelon Institute"),
    instructorName: z.string().trim().min(2).max(200),
    instructorContact: z.string().trim().min(3).max(320),
    signedByName: z.string().trim().min(2).max(200),
    signedRole: z.string().trim().min(2).max(100),
    confirmed: z.literal(true),
  })).mutation(async ({ ctx, input }) => {
    const { orgId, managerEmail } = await resolveOrgManager(ctx);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const email = normalizeEmail(input.operatorEmail);
    const courseKey = canonicalCourseKey(input.courseKey);
    const { from, to } = periodBounds(input);
    const rows = await db.select().from(learningActivitySessions).where(and(
      eq(learningActivitySessions.orgId, orgId), eq(learningActivitySessions.studentEmail, email),
      gt(learningActivitySessions.activeSeconds, 0),
      eq(learningActivitySessions.courseKey, courseKey), gte(learningActivitySessions.startedAt, from), lte(learningActivitySessions.startedAt, to),
    )).orderBy(learningActivitySessions.startedAt).limit(10000);
    if (rows.length === 0) throw new TRPCError({ code: "BAD_REQUEST", message: "There is no verified study activity in this period." });
    const [member] = await db.select({ id: organizationMembers.id, name: organizationMembers.name }).from(organizationMembers)
      .where(and(eq(organizationMembers.orgId, orgId), eq(organizationMembers.email, email))).limit(1);
    const summary = summarizeTrainingSessions(rows);
    const subjectSummary = summary.byActivity.map((item) => item.label).join(", ");
    const reportId = randomUUID();
    const snapshot = {
      reportId, orgId, operatorEmail: email, operatorName: member?.name ?? null, courseKey,
      periodStart: from.toISOString(), periodEnd: to.toISOString(), summary,
      sessions: rows.map((row) => ({
        sessionKey: row.sessionKey, startedAt: row.startedAt.toISOString(), activeSeconds: row.activeSeconds,
        activityType: row.activityType, topic: row.topic, unitsCompleted: row.unitsCompleted, score: row.score, total: row.total,
      })),
      providerName: input.providerName, instructorName: input.instructorName, instructorContact: input.instructorContact,
      signedByName: input.signedByName, signedByEmail: managerEmail, signedRole: input.signedRole,
    };
    const snapshotJson = JSON.stringify(snapshot);
    const digestSha256 = canonicalSnapshotDigest(snapshotJson);
    await db.insert(trainingAttestations).values({
      reportId, orgId, organizationMemberId: member?.id ?? null,
      teamFlexLicenceId: rows.find((row) => row.teamFlexLicenceId != null)?.teamFlexLicenceId ?? null,
      operatorUserId: rows.find((row) => row.userId != null)?.userId ?? null,
      operatorEmail: email, operatorName: member?.name ?? null,
      courseKey, periodStart: from, periodEnd: to, verifiedActiveSeconds: summary.activeSeconds,
      studySessionCount: summary.sessionCount, providerName: input.providerName, instructorName: input.instructorName,
      instructorContact: input.instructorContact, subjectSummary, signedByName: input.signedByName,
      signedByEmail: managerEmail, signedRole: input.signedRole, digestSha256, snapshotJson,
    });
    return { reportId, digestSha256, verifiedActiveSeconds: summary.activeSeconds, studySessionCount: summary.sessionCount };
  }),
});

export async function hasTrainingRecord(emailInput: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const email = normalizeEmail(emailInput);
  const session = await db.select({ id: learningActivitySessions.id }).from(learningActivitySessions)
    .where(and(eq(learningActivitySessions.studentEmail, email), gt(learningActivitySessions.activeSeconds, 0))).limit(1);
  if (session.length > 0) return true;
  const attestation = await db.select({ id: trainingAttestations.id }).from(trainingAttestations)
    .where(eq(trainingAttestations.operatorEmail, email)).limit(1);
  return attestation.length > 0;
}
