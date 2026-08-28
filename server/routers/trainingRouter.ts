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
  assignedAnnualCourseKeys,
  canonicalSnapshotDigest,
  parseVerifiedTrainingSnapshot,
  sessionsToCsv,
  summarizeTrainingSessions,
  trainingSnapshotSchema,
} from "../trainingRecords";

const activityType = z.enum(["quiz", "mock_exam", "flashcards", "process_guide", "ai_tutor"]);
const signerAuthority = z.enum([
  "oro",
  "oro_authorized_designate",
  "oro_manager_or_supervisor",
  "oro_authorized_training_coordinator",
  "manager_acknowledgement",
]);
const MAX_REPORT_SESSIONS = 10_000;
const SESSION_EXPIRY_MS = 5 * 60 * 1000;
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

function requireCompleteSessionSet<T>(rows: T[]): T[] {
  if (rows.length > MAX_REPORT_SESSIONS) {
    throw new TRPCError({
      code: "PAYLOAD_TOO_LARGE",
      message: `This period contains more than ${MAX_REPORT_SESSIONS.toLocaleString()} study sessions. Choose a shorter period so the report and signed snapshot remain complete.`,
    });
  }
  return rows;
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
    const assigned = assignedAnnualCourseKeys(row.courseKey, row.courseKeys);
    // Missing or invalid course assignments fail closed. A legacy seat must not
    // become an all-course reporting entitlement simply because its assignment
    // fields are empty or malformed.
    if (assigned.includes(courseKey)) {
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
    const { db, row } = await getOwnedSession(input.sessionKey, email);
    if (row.status !== "active") return { recorded: false, reason: row.status };
    if (Date.now() - row.lastHeartbeatAt.getTime() > SESSION_EXPIRY_MS) {
      await db.update(learningActivitySessions).set({ status: "abandoned", completedAt: new Date() })
        .where(and(eq(learningActivitySessions.id, row.id), eq(learningActivitySessions.status, "active")));
      throw new TRPCError({ code: "BAD_REQUEST", message: "This study session expired after being inactive for more than five minutes." });
    }
    if (row.lastSequence >= input.sequence) return { recorded: false, reason: "duplicate" };
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
    if (row.status !== "active") return { completed: false, reason: row.status };
    if (Date.now() - row.lastHeartbeatAt.getTime() > SESSION_EXPIRY_MS) {
      await db.update(learningActivitySessions).set({ status: "abandoned", completedAt: new Date() })
        .where(and(eq(learningActivitySessions.id, row.id), eq(learningActivitySessions.status, "active")));
      return { completed: false, reason: "expired" };
    }
    if (row.lastSequence >= input.sequence) return { completed: false, reason: "duplicate" };
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
    const rows = requireCompleteSessionSet(await db.select().from(learningActivitySessions).where(and(
      eq(learningActivitySessions.studentEmail, email),
      gt(learningActivitySessions.activeSeconds, 0),
      gte(learningActivitySessions.startedAt, from),
      lte(learningActivitySessions.startedAt, to),
      ...(courseKey ? [eq(learningActivitySessions.courseKey, courseKey)] : []),
    )).orderBy(desc(learningActivitySessions.startedAt)).limit(MAX_REPORT_SESSIONS + 1));
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
    const rows = requireCompleteSessionSet(await db.select().from(learningActivitySessions).where(and(
      eq(learningActivitySessions.studentEmail, email),
      gt(learningActivitySessions.activeSeconds, 0),
      gte(learningActivitySessions.startedAt, from),
      lte(learningActivitySessions.startedAt, to),
      ...(courseKey ? [eq(learningActivitySessions.courseKey, courseKey)] : []),
    )).orderBy(desc(learningActivitySessions.startedAt)).limit(MAX_REPORT_SESSIONS + 1));
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
    type ManagerOperatorRow = {
      operatorEmail: string;
      courseKey: string;
      courseName: string;
      activeSeconds: number;
      sessionCount: number;
      latestAt: Date | null;
      hasActivity: boolean;
    };
    const operatorMap = new Map<string, ManagerOperatorRow>(operatorGroups.map((row) => [`${normalizeEmail(row.operatorEmail)}\u0000${row.courseKey}`, {
      operatorEmail: row.operatorEmail,
      courseKey: row.courseKey,
      courseName: courseKeyToLabel(row.courseKey),
      activeSeconds: Number(row.activeSeconds),
      sessionCount: Number(row.sessionCount),
      latestAt: new Date(row.latestAt),
      hasActivity: true,
    }]));

    const annualRoster = await db.select({
      email: organizationMembers.email,
      courseKey: organizationMembers.courseKey,
      courseKeys: organizationMembers.courseKeys,
    }).from(organizationMembers).where(and(
      eq(organizationMembers.orgId, orgId),
      eq(organizationMembers.role, "operator"),
      eq(organizationMembers.status, "assigned"),
    ));
    let unassignedOperatorCount = 0;
    for (const member of annualRoster) {
      const assigned = assignedAnnualCourseKeys(member.courseKey, member.courseKeys);
      if (assigned.length === 0) unassignedOperatorCount += 1;
      for (const assignedCourseKey of assigned) {
        const key = `${normalizeEmail(member.email)}\u0000${assignedCourseKey}`;
        if (!operatorMap.has(key)) {
          operatorMap.set(key, {
            operatorEmail: normalizeEmail(member.email),
            courseKey: assignedCourseKey,
            courseName: courseKeyToLabel(assignedCourseKey),
            activeSeconds: 0,
            sessionCount: 0,
            latestAt: null,
            hasActivity: false,
          });
        }
      }
    }

    const now = new Date();
    const flexRoster = await db.select({
      email: teamFlexLicences.invitedEmail,
      courseKey: teamFlexLicences.courseKey,
    }).from(teamFlexLicences).where(and(
      eq(teamFlexLicences.organizationId, orgId),
      eq(teamFlexLicences.status, "active"),
      lte(teamFlexLicences.startsAt, now),
      or(gte(teamFlexLicences.reportingEndsAt, now), gte(teamFlexLicences.accessEndsAt, now)),
    ));
    for (const licence of flexRoster) {
      if (!licence.email) continue;
      const assignedCourseKey = resolveCourseKey(licence.courseKey)?.courseKey;
      if (!assignedCourseKey) continue;
      const key = `${normalizeEmail(licence.email)}\u0000${assignedCourseKey}`;
      if (!operatorMap.has(key)) {
        operatorMap.set(key, {
          operatorEmail: normalizeEmail(licence.email),
          courseKey: assignedCourseKey,
          courseName: courseKeyToLabel(assignedCourseKey),
          activeSeconds: 0,
          sessionCount: 0,
          latestAt: null,
          hasActivity: false,
        });
      }
    }
    const operators = [...operatorMap.values()].sort((a, b) => {
      if (a.latestAt && b.latestAt) return b.latestAt.getTime() - a.latestAt.getTime();
      if (a.latestAt) return -1;
      if (b.latestAt) return 1;
      return a.operatorEmail.localeCompare(b.operatorEmail) || a.courseName.localeCompare(b.courseName);
    });
    const activeSeconds = operators.reduce((total, row) => total + row.activeSeconds, 0);
    const sessionCount = operators.reduce((total, row) => total + row.sessionCount, 0);
    return {
      from, to, activeSeconds, sessionCount, operators, unassignedOperatorCount,
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
    const rows = requireCompleteSessionSet(await db.select().from(learningActivitySessions).where(and(
      eq(learningActivitySessions.orgId, orgId), eq(learningActivitySessions.studentEmail, email),
      gt(learningActivitySessions.activeSeconds, 0),
      eq(learningActivitySessions.courseKey, courseKey), gte(learningActivitySessions.startedAt, from), lte(learningActivitySessions.startedAt, to),
    )).orderBy(desc(learningActivitySessions.startedAt)).limit(MAX_REPORT_SESSIONS + 1));
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
    const rows = requireCompleteSessionSet(await db.select().from(learningActivitySessions).where(and(
      eq(learningActivitySessions.orgId, orgId), eq(learningActivitySessions.studentEmail, email),
      gt(learningActivitySessions.activeSeconds, 0),
      eq(learningActivitySessions.courseKey, courseKey), gte(learningActivitySessions.startedAt, from), lte(learningActivitySessions.startedAt, to),
    )).orderBy(desc(learningActivitySessions.startedAt)).limit(MAX_REPORT_SESSIONS + 1));
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
    learningObjectives: z.string().trim().min(10).max(2000),
    signedByName: z.string().trim().min(2).max(200),
    signedRole: z.string().trim().min(2).max(100),
    signerAuthority,
    structuredAndJobRelatedConfirmed: z.literal(true),
    confirmed: z.literal(true),
  })).mutation(async ({ ctx, input }) => {
    const { orgId, managerEmail } = await resolveOrgManager(ctx);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const email = normalizeEmail(input.operatorEmail);
    const courseKey = canonicalCourseKey(input.courseKey);
    const { from, to } = periodBounds(input);
    const rows = requireCompleteSessionSet(await db.select().from(learningActivitySessions).where(and(
      eq(learningActivitySessions.orgId, orgId), eq(learningActivitySessions.studentEmail, email),
      gt(learningActivitySessions.activeSeconds, 0),
      eq(learningActivitySessions.courseKey, courseKey), gte(learningActivitySessions.startedAt, from), lte(learningActivitySessions.startedAt, to),
    )).orderBy(learningActivitySessions.startedAt).limit(MAX_REPORT_SESSIONS + 1));
    if (rows.length === 0) throw new TRPCError({ code: "BAD_REQUEST", message: "There is no platform-recorded study activity in this period." });
    const [member] = await db.select({ id: organizationMembers.id, name: organizationMembers.name }).from(organizationMembers)
      .where(and(eq(organizationMembers.orgId, orgId), eq(organizationMembers.email, email))).limit(1);
    const summary = summarizeTrainingSessions(rows);
    const subjectSummary = summary.byActivity.map((item) => item.label).join(", ");
    const reportId = randomUUID();
    const signedAt = new Date();
    const attestationKind = input.signerAuthority === "manager_acknowledgement" ? "manager_acknowledgement" : "ojt_attestation";
    const statement = attestationKind === "ojt_attestation"
      ? "The signer confirms that this structured, job-related training record was reviewed in the stated authority. Echelon reports platform activity; final acceptance remains with the employer and regulator."
      : "The signer acknowledges reviewing this platform-recorded study activity. This acknowledgement is not an OJT attestation or regulatory approval."
    const snapshot = trainingSnapshotSchema.parse({
      version: 1,
      reportId, orgId, operatorEmail: email, operatorName: member?.name ?? null, courseKey,
      courseName: courseKeyToLabel(courseKey),
      periodStart: from.toISOString(), periodEnd: to.toISOString(), summary,
      signedAt: signedAt.toISOString(),
      sessions: rows.map((row) => ({
        sessionKey: row.sessionKey, startedAt: row.startedAt.toISOString(), activeSeconds: row.activeSeconds,
        activityType: row.activityType, topic: row.topic, unitsCompleted: row.unitsCompleted, score: row.score, total: row.total,
      })),
      providerName: input.providerName, instructorName: input.instructorName, instructorContact: input.instructorContact,
      learningObjectives: input.learningObjectives,
      signedByName: input.signedByName, signedByEmail: managerEmail, signedRole: input.signedRole,
      signerAuthority: input.signerAuthority, attestationKind, statement,
    });
    const snapshotJson = JSON.stringify(snapshot);
    const digestSha256 = canonicalSnapshotDigest(snapshotJson);
    await db.insert(trainingAttestations).values({
      reportId, orgId, organizationMemberId: member?.id ?? null,
      teamFlexLicenceId: rows.find((row) => row.teamFlexLicenceId != null)?.teamFlexLicenceId ?? null,
      operatorUserId: rows.find((row) => row.userId != null)?.userId ?? null,
      operatorEmail: email, operatorName: member?.name ?? null,
      courseKey, periodStart: from, periodEnd: to, platformRecordedSeconds: summary.activeSeconds,
      supervisorReviewSeconds: summary.supervisorReview.supervisorReviewSeconds,
      studySessionCount: summary.sessionCount, providerName: input.providerName, instructorName: input.instructorName,
      instructorContact: input.instructorContact, learningObjectives: input.learningObjectives,
      subjectSummary, signedByName: input.signedByName, signedByEmail: managerEmail,
      signedRole: input.signedRole, signerAuthority: input.signerAuthority, attestationKind,
      signedAt, digestSha256, snapshotJson,
    });
    return {
      reportId,
      digestSha256,
      platformRecordedSeconds: summary.activeSeconds,
      supervisorReviewSeconds: summary.supervisorReview.supervisorReviewSeconds,
      studySessionCount: summary.sessionCount,
      attestationKind,
    };
  }),

  attestedReport: publicProcedure.input(z.object({ reportId: z.string().uuid() })).query(async ({ ctx, input }) => {
    const { email } = requireIdentity(ctx);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const [record] = await db.select().from(trainingAttestations)
      .where(eq(trainingAttestations.reportId, input.reportId)).limit(1);
    if (!record) throw new TRPCError({ code: "NOT_FOUND", message: "Signed training record not found." });

    if (normalizeEmail(record.operatorEmail) !== email) {
      let managerOrgId: number | null = null;
      try {
        managerOrgId = (await resolveOrgManager(ctx)).orgId;
      } catch {
        // Return one neutral authorization failure for all non-operator viewers.
      }
      if (managerOrgId !== record.orgId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You do not have access to this signed training record." });
      }
    }

    try {
      return {
        snapshot: parseVerifiedTrainingSnapshot(record.snapshotJson, record.digestSha256),
        digestSha256: record.digestSha256,
      };
    } catch {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "This signed record failed its integrity check. Contact Echelon support." });
    }
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
