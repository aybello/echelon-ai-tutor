import { and, desc, eq, gte, inArray, isNull, like, lte, or, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { assessmentActivitySessions, diagnosticSessions as diagnostics, examResults as exams, learningActivitySessions as study, productAnalyticsEvents as events, questionAttempts as attempts, users } from "../drizzle/schema";
import { getDb } from "./db";
import { hashAnalyticsEmail } from "./analytics";
import { adminAssessmentScope, assessmentReadPredicate } from "./assessmentActivityRead";
import type { LearnerActivityFeed, LearnerActivityItem, LearnerOption, LearnerSelection } from "../shared/learnerActivity";

const LIMIT = 200;
async function database() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  return db;
}
const normalize = (value: string) => value.trim().toLowerCase();
const prefix = (value: string) => `${value.replace(/[\\%_]/g, "\\$&")}%`;
export async function searchLearners(query: string) {
  const db = await database();
  const q = normalize(query);
  const exact = q.includes("@");
  const accounts = await db.select({ id: users.id, name: users.name, email: users.email }).from(users)
    .where(exact ? eq(users.email, q) : or(like(users.email, prefix(q)), like(users.name, prefix(q))))
    .orderBy(users.id).limit(21);
  const options: LearnerOption[] = accounts.slice(0, 20).map(row => ({ key: `user:${row.id}`, selection: { userId: row.id }, name: row.name?.trim() || null, email: row.email }));
  // Email-only records never inherit an account name merely because email matches.
  const since = new Date(Date.now() - 30 * 86400000);
  const sources = [study, exams, attempts, diagnostics] as const;
  let partial = accounts.length > 20;
  for (const table of sources) {
    const time = "startedAt" in table ? table.startedAt : "completedAt" in table ? table.completedAt : table.createdAt;
    const rows = await db.selectDistinct({ email: table.studentEmail }).from(table)
      .where(and(isNull(table.userId), exact ? eq(table.studentEmail, q) : like(table.studentEmail, prefix(q)), gte(time, since)))
      .orderBy(table.studentEmail).limit(21);
    partial ||= rows.length > 20;
    for (const row of rows.slice(0, 20)) {
      if (!row.email) continue;
      const email = normalize(row.email);
      if (!options.some(option => option.key === `email:${email}`)) options.push({ key: `email:${email}`, selection: { email }, name: null, email });
    }
  }
  // Exact email can inspect hash-only sign-ins without inventing an account association.
  if (exact && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(q) && !options.some(option => option.key === `email:${q}`)) {
    const found = await db.select({ id: events.id }).from(events).where(and(eq(events.emailHash, hashAnalyticsEmail(q)), isNull(events.userId), eq(events.eventName, "login"), gte(events.occurredAt, since))).limit(1);
    if (found.length) options.push({ key: `email:${q}`, selection: { email: q }, name: null, email: q });
  }
  // The ledger uses its own HMAC namespace, not analytics SHA-256. Exact email
  // only: reuse the authorized reader's observed/verified-email window and never
  // reverse hashes, prefix-match them, or borrow a matching account's identity.
  if (exact && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(q) && !options.some(option => option.key === `email:${q}`)) {
    const window = assessmentReadPredicate(adminAssessmentScope({ email: q }), 30);
    const found = await db.select({ id: assessmentActivitySessions.sessionId }).from(assessmentActivitySessions)
      .where(window.predicate).limit(1);
    if (found.length) options.push({ key: `email:${q}`, selection: { email: q }, name: null, email: q });
  }
  return { learners: options.slice(0, 20), partial: partial || options.length > 20 };
}

export function signInMethod(metadata: string | null): string | null {
  try {
    const parsed = JSON.parse(metadata ?? "null");
    if (parsed?.activityVersion !== 1) return null;
    const methods: Record<string, string> = { oauth: "OAuth", email_otp: "Email OTP", dashboard_otp: "Dashboard OTP", legacy_magic_link: "Legacy magic link" };
    return typeof parsed.method === "string" && Object.hasOwn(methods, parsed.method) ? methods[parsed.method] : null;
  } catch { return null; }
}
export function finalizeLearnerFeed(items: LearnerActivityItem[], partial: boolean, since: Date, until: Date): LearnerActivityFeed {
  const sorted = items.filter(item => item.at >= since && item.at <= until)
    .sort((a, b) => b.at.getTime() - a.at.getTime() || a.key.localeCompare(b.key));
  const visible = sorted.slice(0, LIMIT);
  return { items: visible, lastObservedAt: sorted[0]?.at ?? null,
    recordedStudySeconds: visible.reduce((sum, item) => sum + (item.activeSeconds ?? 0), 0),
    partial: partial || sorted.length > LIMIT, since, until };
}
export async function readLearnerActivity(selection: LearnerSelection, days: 7 | 30): Promise<LearnerActivityFeed> {
  const db = await database();
  const until = new Date();
  const since = new Date(until.getTime() - days * 86400000);
  const identity = (table: typeof study | typeof exams | typeof attempts | typeof diagnostics) => "userId" in selection
    ? eq(table.userId, selection.userId)
    : and(isNull(table.userId), eq(table.studentEmail, normalize(selection.email)));
  const window = (time: typeof study.startedAt | typeof exams.createdAt | typeof diagnostics.completedAt | typeof events.occurredAt | typeof attempts.createdAt) => and(gte(time, since), lte(time, until));
  const eventIdentity = "userId" in selection ? eq(events.userId, String(selection.userId))
    : and(isNull(events.userId), eq(events.emailHash, hashAnalyticsEmail(selection.email)));
  const [log, sessions, results, baselines, practice] = await Promise.all([
    db.select({ id: events.id, at: events.occurredAt, event: events.eventName, metadata: events.metadata, course: events.examType }).from(events)
      .where(and(eventIdentity, inArray(events.eventName, ["login", "ai_tutor_session_saved"]), window(events.occurredAt)))
      .orderBy(desc(events.occurredAt), desc(events.id)).limit(LIMIT + 1),
    db.select({ id: study.id, at: study.lastHeartbeatAt, startedAt: study.startedAt, course: study.courseKey, type: study.activityType, seconds: study.activeSeconds, status: study.status }).from(study)
      .where(and(identity(study), window(study.startedAt))).orderBy(desc(study.lastHeartbeatAt), desc(study.id)).limit(LIMIT + 1),
    db.select({ id: exams.id, at: exams.createdAt, course: exams.examType, correct: exams.score, total: exams.total, calc: exams.calcOnly }).from(exams)
      .where(and(identity(exams), window(exams.createdAt))).orderBy(desc(exams.createdAt), desc(exams.id)).limit(LIMIT + 1),
    db.select({ id: diagnostics.id, at: diagnostics.completedAt, course: diagnostics.courseKey, correct: diagnostics.correct, total: diagnostics.total }).from(diagnostics)
      .where(and(identity(diagnostics), window(diagnostics.completedAt))).orderBy(desc(diagnostics.completedAt), desc(diagnostics.id)).limit(LIMIT + 1),
    db.select({ group: sql<string>`coalesce(${attempts.sessionId}, concat('legacy:', ${attempts.id}))`.as("run_key"), at: sql<Date>`max(${attempts.createdAt})`.as("observed_at"), course: attempts.examType, mode: attempts.quizMode, total: sql<number>`count(*)`, correct: sql<number>`sum(case when ${attempts.correct} = 'yes' then 1 else 0 end)` }).from(attempts)
      .where(and(identity(attempts), window(attempts.createdAt), or(isNull(attempts.quizMode), sql`${attempts.quizMode} <> 'mock'`)))
      .groupBy(sql`coalesce(${attempts.sessionId}, concat('legacy:', ${attempts.id}))`, attempts.examType, attempts.quizMode)
      .orderBy(sql`observed_at desc`, sql`run_key asc`, attempts.examType, attempts.quizMode).limit(LIMIT + 1),
  ]);
  const items: LearnerActivityItem[] = [];
  for (const row of log.slice(0, LIMIT)) {
    const method = row.event === "login" ? signInMethod(row.metadata) : null;
    if (row.event === "login" && !method) continue;
    items.push({ key: `event:${row.id}`, at: row.at, kind: method ? "signin" : "tutor", label: method ? "Signed in" : "AI tutor session saved", course: method ? null : row.course, detail: method ?? "Saved session only; conversation content is not shown" });
  }
  for (const row of sessions.slice(0, LIMIT)) items.push({ key: `study:${row.id}`, at: row.at, kind: "study", label: "Recorded study activity", course: row.course,
    activeSeconds: Math.max(0, Math.min(row.seconds, Math.floor((Math.min(row.at.getTime(), until.getTime()) - row.startedAt.getTime()) / 1000))),
    detail: `${row.type.replaceAll("_", " ")} · study recorder (non-assessment) ${row.status}; not course completion` });
  for (const row of results.slice(0, LIMIT)) items.push({ key: `result:${row.id}`, at: row.at, kind: row.calc === "yes" ? "math" : "mock", label: row.calc === "yes" ? "Math practice" : "Mock exam", course: row.course, correct: row.correct, total: row.total, detail: "Canonical saved result; timing status unavailable in historical result rows. Not a certification exam. Timestamp is when saved; historical interaction detail is unavailable." });
  for (const row of baselines.slice(0, LIMIT)) items.push({ key: `diagnostic:${row.id}`, at: row.at, kind: "diagnostic", label: "Diagnostic completed", course: row.course, correct: row.correct, total: row.total, detail: "Server-scored baseline" });
  for (const [index, row] of practice.slice(0, LIMIT).entries()) items.push({ key: `practice:${index}`, at: new Date(row.at), kind: "practice", label: "Practice activity", course: row.course, correct: Number(row.correct), total: Number(row.total), detail: `${["standard", "quick10", "missed", "qotd", "adaptive"].includes(row.mode ?? "") ? row.mode : "practice"} · recorded answers, not necessarily a completed quiz` });
  return finalizeLearnerFeed(items, [log, sessions, results, baselines, practice].some(rows => rows.length > LIMIT), since, until);
}
