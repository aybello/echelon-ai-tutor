import { and, asc, desc, eq, gt, gte, inArray, isNull, lt, lte, or, sql, type SQL } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { assessmentActivityEmailHash, readAssessmentActivityItems } from "./assessmentActivity";
import { assessmentActivitySessions as sessions, assessmentActivityEvents as events, organizationMembers, organizations, teamFlexLicences, users } from "../drizzle/schema";
import { assessmentActivityItemSchema, assessmentActivityActionSchema } from "../shared/assessmentActivity";
import type { LearnerAssessmentFeed, LearnerAssessmentDetail, LearnerSelection } from "../shared/learnerActivity";
import { resolveCourseKey } from "../shared/courseRegistry";
import { allowedCourseKeysForOrg } from "./stripe/subscriptionProducts";
import { flexLicenceIsVisibleInManagerReport } from "./teams/flexReporting";
import { getDb } from "./db";

const LIMIT = 200;
export const learnerAssessmentDetailInput = z.object({ sessionId: z.string().uuid(), cursor: z.number().int().min(0).max(3000).default(0), days: z.union([z.literal(7), z.literal(30)]) }).strict();
const normalize = (value: string) => value.trim().toLowerCase();
// Must match the issuance namespace, never analytics hashes or anonymous browser identity.
export const assessmentEmailHash = assessmentActivityEmailHash;
export function assessmentActorFilter(selection: LearnerSelection): SQL {
  return "userId" in selection
    ? and(eq(sessions.identityKind, "user"), eq(sessions.userId, selection.userId), isNull(sessions.emailHash))!
    : and(eq(sessions.identityKind, "verified-email"), isNull(sessions.userId), eq(sessions.emailHash, assessmentEmailHash(selection.email)))!;
}
export type AssessmentReadScope = {
  predicate: SQL; startsAt: number; endsAt: number;
  access: LearnerAssessmentFeed["access"];
};
async function database() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  return db;
}
const notFound = () => new TRPCError({ code: "NOT_FOUND", message: "Recorded learner activity unavailable" });
const timestamp = (value: Date | null) => value?.getTime() ?? NaN;
export async function annualAssessmentScope(orgId: number, memberId: number): Promise<AssessmentReadScope> {
  const db = await database();
  const [member] = await db.select().from(organizationMembers).where(and(eq(organizationMembers.id, memberId), eq(organizationMembers.orgId, orgId), eq(organizationMembers.role, "operator"))).limit(1);
  const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);
  if (!member || !org) throw notFound();
  // A missing historical term start cannot authorize a guessed reporting window.
  const startsAt = Math.max(timestamp(member.assignedAt), timestamp(org.termStart));
  const endsAt = Math.min(timestamp(org.termEnd), member.revokedAt ? timestamp(member.revokedAt) : Infinity);
  if (!["assigned", "revoked"].includes(member.status) || !Number.isFinite(startsAt) || !Number.isFinite(endsAt) || startsAt >= endsAt) throw notFound();
  let courses: string[];
  try {
    const raw = member.courseKeys ? z.array(z.string().min(1)).max(100).parse(JSON.parse(member.courseKeys)) : member.courseKey ? [member.courseKey] : allowedCourseKeysForOrg(org.tier, org.province);
    courses = [...new Set(raw.map(key => resolveCourseKey(key)?.courseKey).filter((key): key is string => !!key))];
  } catch { throw notFound(); }
  if (!courses.length) throw notFound();
  // The issued member ID is essential. Account rows are checked, not joined into email history.
  const actor = or(
    and(eq(sessions.identityKind, "user"), isNull(sessions.emailHash), sql`exists (select 1 from ${users} where ${users.id} = ${sessions.userId} and ${users.email} = ${normalize(member.email)})`),
    and(eq(sessions.identityKind, "verified-email"), isNull(sessions.userId), eq(sessions.emailHash, assessmentEmailHash(member.email))),
  );
  return { startsAt, endsAt, predicate: and(actor, eq(sessions.orgId, orgId), eq(sessions.organizationMemberId, memberId), isNull(sessions.flexLicenceId), inArray(sessions.courseKey, courses))!,
    access: { source: "recorded assignment", status: member.status, courses, startsAt: new Date(startsAt).toISOString(), endsAt: new Date(endsAt).toISOString() } };
}
export async function flexAssessmentScope(orgId: number, licenceId: number): Promise<AssessmentReadScope> {
  const db = await database();
  const [licence] = await db.select().from(teamFlexLicences).where(and(eq(teamFlexLicences.id, licenceId), eq(teamFlexLicences.organizationId, orgId))).limit(1);
  if (!licence || !flexLicenceIsVisibleInManagerReport(licence, new Date()) || !["active", "expired"].includes(licence.status) || !licence.activatedAt) throw notFound();
  const startsAt = Math.max(timestamp(licence.startsAt), timestamp(licence.activatedAt));
  const endsAt = timestamp(licence.accessEndsAt);
  const course = resolveCourseKey(licence.courseKey)?.courseKey;
  if (!course || !Number.isFinite(startsAt) || !Number.isFinite(endsAt) || startsAt >= endsAt || (!licence.operatorUserId && !licence.invitedEmail)) throw notFound();
  const actor = assessmentActorFilter(licence.operatorUserId ? { userId: licence.operatorUserId } : { email: licence.invitedEmail! });
  return { startsAt, endsAt, predicate: and(actor, eq(sessions.orgId, orgId), eq(sessions.flexLicenceId, licenceId), isNull(sessions.organizationMemberId), eq(sessions.courseKey, course))!,
    access: { source: "recorded assignment", status: licence.status, courses: [course], startsAt: new Date(startsAt).toISOString(), endsAt: new Date(endsAt).toISOString() } };
}
export function adminAssessmentScope(selection: LearnerSelection): AssessmentReadScope {
  return { predicate: assessmentActorFilter(selection), startsAt: 0, endsAt: Number.MAX_SAFE_INTEGER, access: null };
}
export function assessmentReadPredicate(scope: AssessmentReadScope, days: 7 | 30, now = Date.now()) {
  const since = Math.max(now - days * 86400000, scope.startsAt);
  const until = Math.min(now, scope.endsAt);
  return { since, until, predicate: and(scope.predicate, eq(sessions.source, "observed"), gte(sessions.startedAt, since), lt(sessions.startedAt, scope.endsAt), lte(sessions.startedAt, until), lte(sessions.lastObservedAt, until), lt(sessions.lastObservedAt, scope.endsAt))! };
}
export function parseIssuedAssessmentItems(value: string) {
  try {
    const parsed = z.array(assessmentActivityItemSchema).min(1).max(150).refine(items => new Set(items.map(item => item.id)).size === items.length).safeParse(JSON.parse(value));
    return parsed.success ? parsed.data : null;
  } catch { return null; }
}
export async function readAssessmentSessions(scope: AssessmentReadScope, days: 7 | 30): Promise<LearnerAssessmentFeed> {
  const db = await database();
  const window = assessmentReadPredicate(scope, days);
  const rows = await db.select({ sessionId: sessions.sessionId, courseKey: sessions.courseKey, mode: sessions.mode, timed: sessions.timed, status: sessions.status, startedAt: sessions.startedAt, lastObservedAt: sessions.lastObservedAt, itemCount: sessions.itemCount }).from(sessions)
    .where(window.predicate).orderBy(desc(sessions.lastObservedAt), asc(sessions.sessionId)).limit(LIMIT + 1);
  const visible = rows.slice(0, LIMIT);
  const counts = visible.length ? await db.select({ sessionId: events.sessionId, action: events.action, total: sql<number>`count(*)` }).from(events)
    .innerJoin(sessions, eq(events.sessionId, sessions.sessionId))
    .where(and(window.predicate, inArray(events.sessionId, visible.map(row => row.sessionId)), eq(events.source, "observed"), gte(events.occurredAt, window.since), lte(events.occurredAt, window.until), lt(events.occurredAt, scope.endsAt)))
    .groupBy(events.sessionId, events.action) : [];
  return { sessions: visible.map(row => {
    const count = (action: string) => Number(counts.find(value => value.sessionId === row.sessionId && value.action === action)?.total ?? 0);
    return { ...row, source: "observed" as const, startedAt: new Date(row.startedAt).toISOString(), lastObservedAt: new Date(Math.min(row.lastObservedAt, window.until)).toISOString(),
      eventCount: counts.filter(value => value.sessionId === row.sessionId).reduce((total, value) => total + Number(value.total), 0),
      participated: ["started", "item_presented", "answer_submitted", "selection_changed", "step_answer", "timed_out"].some(action => count(action) > 0),
      answers: count("answer_submitted"), retries: count("retry"), steps: count("step_answer"), hints: count("hint_opened"), explanations: count("explanation_opened"), resumes: count("resumed"), activeSeconds: null };
  }), partial: rows.length > LIMIT, since: new Date(window.since).toISOString(), until: new Date(window.until).toISOString(), access: scope.access };
}
export async function readAssessmentDetails(scope: AssessmentReadScope, input: z.infer<typeof learnerAssessmentDetailInput>): Promise<LearnerAssessmentDetail> {
  const db = await database();
  const window = assessmentReadPredicate(scope, input.days);
  const [session] = await db.select({ sessionId: sessions.sessionId, issuedItemsJson: sessions.issuedItemsJson, manifestHash: sessions.manifestHash }).from(sessions).where(and(window.predicate, eq(sessions.sessionId, input.sessionId))).limit(1);
  if (!session) throw notFound();
  // Reapply scope to the joined session for every event page, including arbitrary UUIDs/cursors.
  const rows = await db.select({ sequence: events.sequence, action: events.action, itemId: events.itemId, stepId: events.stepId, chosenAnswer: events.chosenAnswer, observedCorrect: events.observedCorrect, occurredAt: events.occurredAt,
    firstRecordedAnswer: sql<number>`case when ${events.action} = 'answer_submitted' and not exists (select 1 from assessment_activity_events earlier where earlier.sessionId = ${events.sessionId} and earlier.itemId = ${events.itemId} and earlier.action = 'answer_submitted' and earlier.sequence < ${events.sequence}) then 1 else 0 end` }).from(events)
    .innerJoin(sessions, eq(events.sessionId, sessions.sessionId))
    .where(and(window.predicate, eq(events.sessionId, input.sessionId), eq(events.source, "observed"), gt(events.sequence, input.cursor), gte(events.occurredAt, window.since), lte(events.occurredAt, window.until), lt(events.occurredAt, scope.endsAt)))
    .orderBy(asc(events.sequence)).limit(51);
  return { sessionId: session.sessionId, items: readAssessmentActivityItems(session.issuedItemsJson, session.manifestHash), events: rows.slice(0, 50).map(row => ({ ...row, action: assessmentActivityActionSchema.safeParse(row.action).success ? row.action : "unknown recorded action", source: "observed" as const, occurredAt: new Date(row.occurredAt).toISOString(), firstRecordedAnswer: row.firstRecordedAnswer === 1 })), nextCursor: rows.length > 50 ? rows[49].sequence : null };
}
