import { randomUUID } from "crypto";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, gt, gte, lte, or, sql } from "drizzle-orm";
import { z } from "zod";
import { learningActivitySessions, organizationMembers, organizations, teamFlexLicences, trainingAttestations } from "../../drizzle/schema";
import { courseKeyToLabel, getCourseByKey, resolveCourseKey } from "../../shared/courseRegistry";
import { normalizeEmail } from "../_core/access";
import { assertAccess, identityEmail, resolveVerifiedIdentity } from "../_core/accessService";
import { getDb } from "../db";
import { trackEvent } from "../analytics";
import { resolveOrgManager } from "./orgRouter";
import { ACTIVITY_LABELS, assignedAnnualCourseKeys, canReadImmutableRecord, canonicalSnapshotDigest, parseVerifiedTrainingSnapshot, requireCompleteSessionSet, sessionsToCsv, summarizeTrainingSessions, trainingSnapshotSchema } from "../trainingRecords";
import { publicProcedure, router } from "../_core/trpc";

const activityType = z.enum(["quiz", "mock_exam", "flashcards", "process_guide", "ai_tutor"]);
const signerAuthority = z.enum(["oro", "oro_authorized_designate", "oro_manager_or_supervisor", "oro_authorized_training_coordinator", "manager_acknowledgement"]);
const SESSION_EXPIRY_MS = 5 * 60 * 1000;
const periodInput = z.object({ from: z.coerce.date().optional(), to: z.coerce.date().optional(), courseKey: z.string().max(64).optional() }).optional();

function affectedRows(result: unknown): number {
  const candidate = result as { affectedRows?: number } | [{ affectedRows?: number }];
  return Array.isArray(candidate) ? candidate[0]?.affectedRows ?? 0 : candidate?.affectedRows ?? 0;
}

function requireIdentity(ctx: Parameters<typeof resolveVerifiedIdentity>[0]) {
  const identity = resolveVerifiedIdentity(ctx);
  const email = identityEmail(identity);
  if (!email) throw new TRPCError({ code: "UNAUTHORIZED", message: "Sign in to record or view training hours." });
  return { email: normalizeEmail(email), userId: identity.type === "oauth" ? identity.userId : null };
}

function canonicalCourseKey(input: string) {
  const course = resolveCourseKey(input);
  if (!course || !getCourseByKey(course.courseKey)) throw new TRPCError({ code: "BAD_REQUEST", message: "Unknown course." });
  return course.courseKey;
}

function periodBounds(input?: z.infer<typeof periodInput>) {
  const to = input?.to ?? new Date();
  const from = input?.from ?? new Date(to.getTime() - 365 * 24 * 60 * 60 * 1000);
  if (from > to) throw new TRPCError({ code: "BAD_REQUEST", message: "Start date must be before end date." });
  if (to.getTime() - from.getTime() > 5 * 365 * 24 * 60 * 60 * 1000) throw new TRPCError({ code: "BAD_REQUEST", message: "Reports are limited to five years at a time." });
  return { from, to };
}

async function resolveTrainingOwnership(email: string, userId: number | null, courseKey: string) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  const now = new Date();
  const annualRows = await db.select({ memberId: organizationMembers.id, orgId: organizationMembers.orgId, courseKey: organizationMembers.courseKey, courseKeys: organizationMembers.courseKeys })
    .from(organizationMembers).innerJoin(organizations, eq(organizations.id, organizationMembers.orgId))
    .where(and(eq(organizationMembers.email, email), eq(organizationMembers.role, "operator"), eq(organizationMembers.status, "assigned"), or(eq(organizations.status, "active"), eq(organizations.status, "past_due")), gt(organizations.termEnd, now))).limit(10);
  for (const row of annualRows) {
    if (assignedAnnualCourseKeys(row.courseKey, row.courseKeys).includes(courseKey)) return { orgId: row.orgId, organizationMemberId: row.memberId, teamFlexLicenceId: null };
  }
  const flexRows = await db.select({ id: teamFlexLicences.id, organizationId: teamFlexLicences.organizationId, courseKey: teamFlexLicences.courseKey })
    .from(teamFlexLicences).where(and(eq(teamFlexLicences.status, "active"), lte(teamFlexLicences.startsAt, now), gte(teamFlexLicences.accessEndsAt, now), or(eq(teamFlexLicences.invitedEmail, email), ...(userId ? [eq(teamFlexLicences.operatorUserId, userId)] : [])))).limit(20);
  const flex = flexRows.find((row) => resolveCourseKey(row.courseKey)?.courseKey === courseKey);
  return flex ? { orgId: flex.organizationId, organizationMemberId: null, teamFlexLicenceId: flex.id } : { orgId: null, organizationMemberId: null, teamFlexLicenceId: null };
}

async function ownedSession(sessionKey: string, email: string) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  const [row] = await db.select().from(learningActivitySessions).where(and(eq(learningActivitySessions.sessionKey, sessionKey), eq(learningActivitySessions.studentEmail, email))).limit(1);
  if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Training session not found." });
  return { db, row };
}

const heartbeatInput = z.object({ sessionKey: z.string().uuid(), sequence: z.number().int().positive().max(1_000_000), activeSeconds: z.number().int().min(0).max(45), unitsCompleted: z.number().int().min(0).max(1_000_000).default(0), topic: z.string().trim().max(128).optional(), score: z.number().int().min(0).max(1_000_000).optional(), total: z.number().int().positive().max(1_000_000).optional() });

async function sessionsFor(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, email: string, from: Date, to: Date, courseKey?: string, orgId?: number) {
  const rows = await db.select().from(learningActivitySessions).where(and(
    eq(learningActivitySessions.studentEmail, email), gt(learningActivitySessions.activeSeconds, 0), gte(learningActivitySessions.startedAt, from), lte(learningActivitySessions.startedAt, to),
    ...(courseKey ? [eq(learningActivitySessions.courseKey, courseKey)] : []), ...(orgId != null ? [eq(learningActivitySessions.orgId, orgId)] : []),
  )).orderBy(desc(learningActivitySessions.startedAt)).limit(10_001);
  try { return requireCompleteSessionSet(rows); } catch (error) { throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: error instanceof Error ? error.message : "Choose a shorter reporting period." }); }
}

export const trainingRouter = router({
  start: publicProcedure.input(z.object({ sessionKey: z.string().uuid(), courseKey: z.string().min(1).max(64), activityType, topic: z.string().trim().max(128).optional() })).mutation(async ({ ctx, input }) => {
    const { email, userId } = requireIdentity(ctx); const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const courseKey = canonicalCourseKey(input.courseKey); await assertAccess(ctx, courseKey);
    const [existing] = await db.select({ email: learningActivitySessions.studentEmail }).from(learningActivitySessions).where(eq(learningActivitySessions.sessionKey, input.sessionKey)).limit(1);
    if (existing) { if (existing.email !== email) throw new TRPCError({ code: "CONFLICT", message: "Session key is already in use." }); return { tracking: true, sessionKey: input.sessionKey }; }
    const ownership = await resolveTrainingOwnership(email, userId, courseKey);
    await db.insert(learningActivitySessions).values({ sessionKey: input.sessionKey, userId, studentEmail: email, ...ownership, courseKey, activityType: input.activityType, topic: input.topic || null });
    await trackEvent("training_session_started", {
      userId: userId?.toString() ?? null,
      email,
      examType: courseKey,
      orgId: ownership.orgId,
      extra: { activityType: input.activityType },
    });
    return { tracking: true, sessionKey: input.sessionKey };
  }),
  heartbeat: publicProcedure.input(heartbeatInput).mutation(async ({ ctx, input }) => {
    const { email } = requireIdentity(ctx); const { db, row } = await ownedSession(input.sessionKey, email);
    if (row.status !== "active") return { recorded: false, reason: row.status };
    if (Date.now() - row.lastHeartbeatAt.getTime() > SESSION_EXPIRY_MS) { await db.update(learningActivitySessions).set({ status: "abandoned", completedAt: new Date() }).where(and(eq(learningActivitySessions.id, row.id), eq(learningActivitySessions.status, "active"))); throw new TRPCError({ code: "BAD_REQUEST", message: "This study session expired after five minutes of inactivity." }); }
    if (row.lastSequence >= input.sequence) return { recorded: false, reason: "duplicate" };
    await db.update(learningActivitySessions).set({ activeSeconds: sql`LEAST(${learningActivitySessions.activeSeconds} + ${input.activeSeconds}, TIMESTAMPDIFF(SECOND, ${learningActivitySessions.startedAt}, NOW()))`, lastSequence: input.sequence, lastHeartbeatAt: new Date(), unitsCompleted: sql`GREATEST(${learningActivitySessions.unitsCompleted}, ${input.unitsCompleted})`, ...(input.topic ? { topic: input.topic } : {}) }).where(and(eq(learningActivitySessions.id, row.id), eq(learningActivitySessions.status, "active"), sql`${learningActivitySessions.lastSequence} < ${input.sequence}`));
    return { recorded: true };
  }),
  complete: publicProcedure.input(heartbeatInput).mutation(async ({ ctx, input }) => {
    const { email } = requireIdentity(ctx); const { db, row } = await ownedSession(input.sessionKey, email);
    if (row.status === "completed") return { completed: true }; if (row.status !== "active") return { completed: false, reason: row.status };
    if (Date.now() - row.lastHeartbeatAt.getTime() > SESSION_EXPIRY_MS) { await db.update(learningActivitySessions).set({ status: "abandoned", completedAt: new Date() }).where(and(eq(learningActivitySessions.id, row.id), eq(learningActivitySessions.status, "active"))); return { completed: false, reason: "expired" }; }
    if (row.lastSequence >= input.sequence) return { completed: false, reason: "duplicate" };
    const completionResult = await db.update(learningActivitySessions).set({ activeSeconds: sql`LEAST(${learningActivitySessions.activeSeconds} + ${input.activeSeconds}, TIMESTAMPDIFF(SECOND, ${learningActivitySessions.startedAt}, NOW()))`, lastSequence: input.sequence, lastHeartbeatAt: new Date(), unitsCompleted: sql`GREATEST(${learningActivitySessions.unitsCompleted}, ${input.unitsCompleted})`, ...(input.topic ? { topic: input.topic } : {}), score: input.score ?? null, total: input.total ?? null, status: "completed", completedAt: new Date() }).where(and(eq(learningActivitySessions.id, row.id), eq(learningActivitySessions.status, "active"), sql`${learningActivitySessions.lastSequence} < ${input.sequence}`));
    if (affectedRows(completionResult) !== 1) return { completed: false, reason: "duplicate" };
    await trackEvent("training_session_completed", {
      userId: row.userId?.toString() ?? null,
      email,
      examType: row.courseKey,
      orgId: row.orgId,
      extra: { activityType: row.activityType, unitsCompleted: input.unitsCompleted },
    });
    return { completed: true };
  }),
  mySummary: publicProcedure.input(periodInput).query(async ({ ctx, input }) => {
    const { email } = requireIdentity(ctx); const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const { from, to } = periodBounds(input); const courseKey = input?.courseKey ? canonicalCourseKey(input.courseKey) : undefined; const sessions = await sessionsFor(db, email, from, to, courseKey);
    const attestations = await db.select().from(trainingAttestations).where(eq(trainingAttestations.operatorEmail, email)).orderBy(desc(trainingAttestations.signedAt)).limit(50);
    return { email, from, to, ...summarizeTrainingSessions(sessions), sessions, attestations };
  }),
  myCsv: publicProcedure.input(periodInput).query(async ({ ctx, input }) => {
    const { email } = requireIdentity(ctx); const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const { from, to } = periodBounds(input); const courseKey = input?.courseKey ? canonicalCourseKey(input.courseKey) : undefined; const sessions = await sessionsFor(db, email, from, to, courseKey);
    await trackEvent("training_hours_exported", { email, examType: courseKey ?? null, extra: { audience: "operator", sessionCount: sessions.length } });
    return { csv: sessionsToCsv(sessions), filename: `echelon-training-hours-${from.toISOString().slice(0, 10)}-${to.toISOString().slice(0, 10)}.csv` };
  }),
  managerSummary: publicProcedure.input(periodInput).query(async ({ ctx, input }) => {
    const { orgId } = await resolveOrgManager(ctx); const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" }); const { from, to } = periodBounds(input);
    const grouped = await db.select({ operatorEmail: learningActivitySessions.studentEmail, courseKey: learningActivitySessions.courseKey, activeSeconds: sql<number>`COALESCE(SUM(${learningActivitySessions.activeSeconds}), 0)`, sessionCount: sql<number>`COUNT(*)`, latestAt: sql<Date>`MAX(${learningActivitySessions.startedAt})` }).from(learningActivitySessions).where(and(eq(learningActivitySessions.orgId, orgId), gt(learningActivitySessions.activeSeconds, 0), gte(learningActivitySessions.startedAt, from), lte(learningActivitySessions.startedAt, to))).groupBy(learningActivitySessions.studentEmail, learningActivitySessions.courseKey);
    type ManagerOperatorRow = { operatorEmail: string; courseKey: string; courseName: string; activeSeconds: number; sessionCount: number; latestAt: Date | null; hasActivity: boolean };
    const operatorMap = new Map<string, ManagerOperatorRow>(grouped.map((row) => [`${normalizeEmail(row.operatorEmail)}\u0000${row.courseKey}`, { operatorEmail: normalizeEmail(row.operatorEmail), courseKey: row.courseKey, courseName: courseKeyToLabel(row.courseKey), activeSeconds: Number(row.activeSeconds), sessionCount: Number(row.sessionCount), latestAt: row.latestAt ? new Date(row.latestAt) : null, hasActivity: true }]));
    const annual = await db.select({ email: organizationMembers.email, courseKey: organizationMembers.courseKey, courseKeys: organizationMembers.courseKeys }).from(organizationMembers).where(and(eq(organizationMembers.orgId, orgId), eq(organizationMembers.role, "operator"), eq(organizationMembers.status, "assigned")));
    let unassignedOperatorCount = 0;
    for (const member of annual) {
      const assignments = assignedAnnualCourseKeys(member.courseKey, member.courseKeys);
      if (assignments.length === 0) unassignedOperatorCount += 1;
      for (const assigned of assignments) { const key = `${normalizeEmail(member.email)}\u0000${assigned}`; if (!operatorMap.has(key)) operatorMap.set(key, { operatorEmail: normalizeEmail(member.email), courseKey: assigned, courseName: courseKeyToLabel(assigned), activeSeconds: 0, sessionCount: 0, latestAt: null, hasActivity: false }); }
    }
    const now = new Date();
    const coursePassOperators = await db.select({ email: teamFlexLicences.invitedEmail, courseKey: teamFlexLicences.courseKey }).from(teamFlexLicences).where(and(
      eq(teamFlexLicences.organizationId, orgId),
      eq(teamFlexLicences.status, "active"),
      lte(teamFlexLicences.startsAt, now),
      or(gte(teamFlexLicences.reportingEndsAt, now), gte(teamFlexLicences.accessEndsAt, now)),
    ));
    for (const licence of coursePassOperators) {
      if (!licence.email) continue;
      const courseKey = resolveCourseKey(licence.courseKey)?.courseKey;
      if (!courseKey) continue;
      const operatorEmail = normalizeEmail(licence.email);
      const key = `${operatorEmail}\u0000${courseKey}`;
      if (!operatorMap.has(key)) operatorMap.set(key, { operatorEmail, courseKey, courseName: courseKeyToLabel(courseKey), activeSeconds: 0, sessionCount: 0, latestAt: null, hasActivity: false });
    }
    const activity = await db.select({ activityType: learningActivitySessions.activityType, activeSeconds: sql<number>`COALESCE(SUM(${learningActivitySessions.activeSeconds}), 0)`, sessionCount: sql<number>`COUNT(*)` }).from(learningActivitySessions).where(and(eq(learningActivitySessions.orgId, orgId), gt(learningActivitySessions.activeSeconds, 0), gte(learningActivitySessions.startedAt, from), lte(learningActivitySessions.startedAt, to))).groupBy(learningActivitySessions.activityType);
    const operators = [...operatorMap.values()].sort((a, b) => (b.latestAt?.getTime() ?? 0) - (a.latestAt?.getTime() ?? 0) || a.operatorEmail.localeCompare(b.operatorEmail));
    return { from, to, operators, unassignedOperatorCount, activeSeconds: operators.reduce((total, item) => total + item.activeSeconds, 0), sessionCount: operators.reduce((total, item) => total + item.sessionCount, 0), byActivity: activity.map((item) => ({ activityType: item.activityType, label: ACTIVITY_LABELS[item.activityType], activeSeconds: Number(item.activeSeconds), sessionCount: Number(item.sessionCount) })) };
  }),
  managerOperatorReport: publicProcedure.input(z.object({ operatorEmail: z.string().email(), courseKey: z.string().max(64), from: z.coerce.date(), to: z.coerce.date() })).query(async ({ ctx, input }) => {
    const { orgId } = await resolveOrgManager(ctx); const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" }); const { from, to } = periodBounds(input); const email = normalizeEmail(input.operatorEmail); const courseKey = canonicalCourseKey(input.courseKey);
    const sessions = await sessionsFor(db, email, from, to, courseKey, orgId); const [member] = await db.select({ name: organizationMembers.name }).from(organizationMembers).where(and(eq(organizationMembers.orgId, orgId), eq(organizationMembers.email, email))).limit(1);
    const attestations = await db.select().from(trainingAttestations).where(and(eq(trainingAttestations.orgId, orgId), eq(trainingAttestations.operatorEmail, email), eq(trainingAttestations.courseKey, courseKey))).orderBy(desc(trainingAttestations.signedAt)).limit(20);
    return { operatorEmail: email, operatorName: member?.name ?? null, courseKey, from, to, ...summarizeTrainingSessions(sessions), sessions, attestations };
  }),
  managerCsv: publicProcedure.input(z.object({ operatorEmail: z.string().email(), courseKey: z.string().max(64), from: z.coerce.date(), to: z.coerce.date() })).query(async ({ ctx, input }) => {
    const { orgId, managerEmail } = await resolveOrgManager(ctx); const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" }); const { from, to } = periodBounds(input); const email = normalizeEmail(input.operatorEmail); const courseKey = canonicalCourseKey(input.courseKey); const sessions = await sessionsFor(db, email, from, to, courseKey, orgId);
    await trackEvent("training_hours_exported", { email: managerEmail, examType: courseKey, orgId, extra: { audience: "manager", sessionCount: sessions.length } });
    return { csv: sessionsToCsv(sessions), filename: `${email.replace(/[^a-z0-9]+/gi, "-")}-training-hours.csv` };
  }),
  attest: publicProcedure.input(z.object({ operatorEmail: z.string().email(), courseKey: z.string().max(64), from: z.coerce.date(), to: z.coerce.date(), providerName: z.string().trim().min(2).max(200).default("Echelon Institute"), instructorName: z.string().trim().min(2).max(200), instructorContact: z.string().trim().min(3).max(320), learningObjectives: z.string().trim().min(10).max(2000), signedByName: z.string().trim().min(2).max(200), signedRole: z.string().trim().min(2).max(100), signerAuthority, structuredAndJobRelatedConfirmed: z.literal(true), confirmed: z.literal(true) })).mutation(async ({ ctx, input }) => {
    const { orgId, managerEmail } = await resolveOrgManager(ctx); const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" }); const { from, to } = periodBounds(input); const email = normalizeEmail(input.operatorEmail); const courseKey = canonicalCourseKey(input.courseKey); const sessions = (await sessionsFor(db, email, from, to, courseKey, orgId)).reverse();
    if (!sessions.length) throw new TRPCError({ code: "BAD_REQUEST", message: "There is no platform-recorded study activity in this period." }); const [member] = await db.select({ id: organizationMembers.id, name: organizationMembers.name }).from(organizationMembers).where(and(eq(organizationMembers.orgId, orgId), eq(organizationMembers.email, email))).limit(1); const summary = summarizeTrainingSessions(sessions); const reportId = randomUUID(); const signedAt = new Date(); const attestationKind = input.signerAuthority === "manager_acknowledgement" ? "manager_acknowledgement" : "ojt_attestation"; const statement = attestationKind === "ojt_attestation" ? "The signer confirms this structured, job-related training record was reviewed under the stated authority. Echelon reports platform activity; final acceptance remains with the employer and regulator." : "The signer acknowledges reviewing this platform-recorded study activity. This acknowledgement is not an OJT attestation or regulatory approval.";
    const snapshot = trainingSnapshotSchema.parse({ version: 1, reportId, orgId, operatorEmail: email, operatorName: member?.name ?? null, courseKey, courseName: courseKeyToLabel(courseKey), periodStart: from.toISOString(), periodEnd: to.toISOString(), summary, signedAt: signedAt.toISOString(), sessions: sessions.map((row) => ({ sessionKey: row.sessionKey, startedAt: row.startedAt.toISOString(), activeSeconds: row.activeSeconds, activityType: row.activityType, topic: row.topic, unitsCompleted: row.unitsCompleted, score: row.score, total: row.total })), providerName: input.providerName, instructorName: input.instructorName, instructorContact: input.instructorContact, learningObjectives: input.learningObjectives, signedByName: input.signedByName, signedByEmail: managerEmail, signedRole: input.signedRole, signerAuthority: input.signerAuthority, attestationKind, statement });
    const snapshotJson = JSON.stringify(snapshot); const digestSha256 = canonicalSnapshotDigest(snapshotJson); await db.insert(trainingAttestations).values({ reportId, orgId, organizationMemberId: member?.id ?? null, teamFlexLicenceId: sessions.find((row) => row.teamFlexLicenceId != null)?.teamFlexLicenceId ?? null, operatorUserId: sessions.find((row) => row.userId != null)?.userId ?? null, operatorEmail: email, operatorName: member?.name ?? null, courseKey, periodStart: from, periodEnd: to, platformRecordedSeconds: summary.activeSeconds, supervisorReviewSeconds: summary.supervisorReview.supervisorReviewSeconds, studySessionCount: summary.sessionCount, providerName: input.providerName, instructorName: input.instructorName, instructorContact: input.instructorContact, learningObjectives: input.learningObjectives, subjectSummary: summary.byActivity.map((item) => item.label).join(", "), signedByName: input.signedByName, signedByEmail: managerEmail, signedRole: input.signedRole, signerAuthority: input.signerAuthority, attestationKind, signedAt, digestSha256, snapshotJson });
    await trackEvent("training_record_attested", { email: managerEmail, examType: courseKey, orgId, extra: { attestationKind, sessionCount: summary.sessionCount, platformRecordedSeconds: summary.activeSeconds } });
    return { reportId, digestSha256, platformRecordedSeconds: summary.activeSeconds, supervisorReviewSeconds: summary.supervisorReview.supervisorReviewSeconds, studySessionCount: summary.sessionCount, attestationKind };
  }),
  attestedReport: publicProcedure.input(z.object({ reportId: z.string().uuid() })).query(async ({ ctx, input }) => {
    const { email } = requireIdentity(ctx); const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" }); const [record] = await db.select().from(trainingAttestations).where(eq(trainingAttestations.reportId, input.reportId)).limit(1); if (!record) throw new TRPCError({ code: "NOT_FOUND", message: "Signed training record not found." });
    let managerOrgId: number | null = null;
    if (normalizeEmail(record.operatorEmail) !== email) { try { managerOrgId = (await resolveOrgManager(ctx)).orgId; } catch { /* deny non-manager users below */ } }
    if (!canReadImmutableRecord(email, record.operatorEmail, record.orgId, managerOrgId)) throw new TRPCError({ code: "FORBIDDEN", message: "You do not have access to this signed training record." });
    try { return { snapshot: parseVerifiedTrainingSnapshot(record.snapshotJson, record.digestSha256), digestSha256: record.digestSha256 }; } catch { throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "This signed record failed its integrity check. Contact Echelon support." }); }
  }),
});

export async function hasTrainingRecord(emailInput: string): Promise<boolean> {
  const db = await getDb(); if (!db) return false; const email = normalizeEmail(emailInput);
  const [session] = await db.select({ id: learningActivitySessions.id }).from(learningActivitySessions).where(and(eq(learningActivitySessions.studentEmail, email), gt(learningActivitySessions.activeSeconds, 0))).limit(1);
  if (session) return true;
  const [attestation] = await db.select({ id: trainingAttestations.id }).from(trainingAttestations).where(eq(trainingAttestations.operatorEmail, email)).limit(1);
  return !!attestation;
}
