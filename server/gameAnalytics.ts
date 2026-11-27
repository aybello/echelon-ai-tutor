import { createHmac, timingSafeEqual } from "node:crypto";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { ENV } from "./_core/env";
import type { TrpcContext } from "./_core/context";
import { isInternalBuyerEmail } from "../shared/revenueReporting";
import { interactiveModeSchema, type InteractiveSessionResponse } from "../shared/interactiveSessions";
import { gameActivityInputSchema, type GameActivitySummary } from "../shared/gameAnalytics";
import { getCourseByKey } from "../shared/courseRegistry";
import { persistAnalyticsEvent } from "./analytics";
import { getDb } from "./db";

const capabilitySchema = z.object({
  id: z.string().uuid(), course: z.string().max(64), mode: interactiveModeSchema,
  items: z.array(z.string().max(80)).min(1).max(50), player: z.string().regex(/^[a-f0-9]{64}$/),
  kind: z.enum(["identified", "anonymous"]), expires: z.number().int(),
}).strict();
const hash = (value: string) => createHmac("sha256", ENV.cookieSecret).update(`game-activity:v1:${value}`).digest("hex");
export function gamePlayerHashForSelection(selection: { userId: number } | { email: string }) {
  return hash("userId" in selection ? `user:${selection.userId}` : `email:${selection.email.trim().toLowerCase()}`);
}
export function gameIdentity(ctx: Pick<TrpcContext, "user" | "studentEmail">, visitorId: string) {
  if (!ENV.cookieSecret || ctx.user?.role === "admin" || isInternalBuyerEmail(ctx.user?.email) || isInternalBuyerEmail(ctx.studentEmail)) return null;
  const identity = ctx.user ? { userId: ctx.user.id } : ctx.studentEmail ? { email: ctx.studentEmail } : null;
  return { player: identity ? gamePlayerHashForSelection(identity) : hash(`browser:${visitorId}`), kind: identity ? "identified" as const : "anonymous" as const };
}
export function issueGameCapability(session: InteractiveSessionResponse, ctx: TrpcContext, visitorId?: string): string | undefined {
  if (!visitorId || !session.examples.length) return;
  const identity = gameIdentity(ctx, visitorId);
  if (!identity) return;
  const body = Buffer.from(JSON.stringify({ id: session.sessionId, course: session.courseKey, mode: session.mode,
    items: session.examples.map(item => item.id), ...identity, expires: Date.now() + 6 * 60 * 60 * 1000 })).toString("base64url");
  return `${body}.${hash(body)}`;
}
export function verifyGameCapability(token: string, ctx: TrpcContext, visitorId: string) {
  const [body, signature, extra] = token.split(".");
  if (!ENV.cookieSecret || !body || !signature || extra || !/^[a-f0-9]{64}$/.test(signature) || !timingSafeEqual(Buffer.from(hash(body)), Buffer.from(signature))) return null;
  try {
    const cap = capabilitySchema.parse(JSON.parse(Buffer.from(body, "base64url").toString("utf8")));
    const course = getCourseByKey(cap.course);
    const identity = gameIdentity(ctx, visitorId);
    if (cap.expires < Date.now() || !course?.isActive || course.courseKey === "electrician-309a" || cap.player !== identity?.player || cap.kind !== identity.kind) return null;
    return cap;
  } catch { return null; }
}

/** Bounded per-process defense in addition to the existing /api/trpc IP limiter. */
const activityBudgets = new Map<string, { count: number; until: number }>();
function consumeBudget(player: string) {
  const now = Date.now();
  for (const [key, value] of activityBudgets) if (value.until <= now) activityBudgets.delete(key);
  const budget = activityBudgets.get(player);
  if (budget && budget.count >= 120) throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
  if (!budget && activityBudgets.size >= 10000) throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
  activityBudgets.set(player, budget ? { ...budget, count: budget.count + 1 } : { count: 1, until: now + 60000 });
}
// mysql2 execute returns [rows, fields]. Keep driver-specific unpacking here.
function rowsOf(result: unknown): Record<string, unknown>[] {
  return (result as [Record<string, unknown>[], unknown])[0];
}
export async function recordGameActivity(input: z.infer<typeof gameActivityInputSchema>, ctx: TrpcContext) {
  if (ctx.req.headers.dnt === "1" || ctx.req.headers["sec-gpc"] === "1") return { accepted: false };
  const cap = verifyGameCapability(input.capability, ctx, input.visitorId);
  if (!cap) return { accepted: false };
  consumeBudget(cap.player);
  if (input.timed && cap.mode !== "rapid-swipe") return { accepted: false };
  const roundId = hash(`${cap.id}:${input.round}:${input.timed}`);
  const event = input.event;
  if (event.kind === "answer" && !cap.items.includes(event.itemId)) return { accepted: false };
  const db = await getDb();
  if (!db) return { accepted: false };
  if (event.kind === "complete") {
    // Completion is never inferred from navigation. Untimed rounds require every
    // delivered item; timed rounds require at least one answer and explicit finish.
    const [row] = rowsOf(await db.execute(sql`SELECT COUNT(DISTINCT JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.itemId'))) AS answered
      FROM product_analytics_events WHERE eventName = 'game_answered' AND anonymousHash = ${cap.player}
      AND occurredAt >= ${new Date(Date.now() - 6 * 60 * 60 * 1000)}
      AND JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.roundId')) = ${roundId}`));
    if (Number(row?.answered ?? 0) < (input.timed ? 1 : cap.items.length)) return { accepted: false };
  }
  // No unique key exists in this table. Durable duplicate rows are intentionally
  // harmless: all summaries DISTINCT the server-derived event and round IDs.
  const eventId = hash(`${roundId}:${event.kind === "answer" ? input.timed ? `answer:${event.sequence}` : `answer:${event.itemId}` : "complete"}`);
  await persistAnalyticsEvent({ event: event.kind === "answer" ? "game_answered" : "game_round_completed", ts: new Date().toISOString(),
    identityHash: cap.player, productKey: cap.course,
    extra: { eventId, roundId, mode: cap.mode, playerKind: cap.kind, utcDay: new Date().toISOString().slice(0, 10), ...(event.kind === "answer" ? { itemId: event.itemId } : {}) } });
  return { accepted: true };
}

/** Fixed 7/30-day windows, DB-side DISTINCT aggregation; never load event history. */
export async function readGameActivity(days: 7 | 30): Promise<GameActivitySummary> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Game analytics unavailable." });
  const since = new Date(Date.now() - days * 86400000);
  const base = sql`FROM product_analytics_events WHERE eventName = 'game_answered' AND occurredAt >= ${since} AND occurredAt <= NOW()`;
  const [totals] = rowsOf(await db.execute(sql`SELECT COUNT(DISTINCT anonymousHash) AS players,
    COUNT(DISTINCT CASE WHEN JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.playerKind')) = 'anonymous' THEN anonymousHash END) AS anonymousBrowsers,
    COUNT(DISTINCT CASE WHEN JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.playerKind')) = 'identified' THEN anonymousHash END) AS identifiedPlayers,
    COUNT(DISTINCT JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.roundId'))) AS roundsStarted,
    COUNT(DISTINCT JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.eventId'))) AS questionsAnswered ${base}`));
  const [returning] = rowsOf(await db.execute(sql`SELECT COUNT(*) AS n FROM (
    SELECT player FROM (SELECT anonymousHash AS player, MIN(JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.utcDay'))) AS answeredDay ${base}
      GROUP BY anonymousHash, JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.eventId'))) deduplicated_answers
    GROUP BY player HAVING COUNT(DISTINCT answeredDay) >= 2) returning_players`));
  const [completed] = rowsOf(await db.execute(sql`SELECT COUNT(DISTINCT JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.roundId'))) AS n
    FROM product_analytics_events WHERE eventName = 'game_round_completed' AND occurredAt >= ${since} AND occurredAt <= NOW()`));
  const courses = rowsOf(await db.execute(sql`SELECT productKey AS k, COUNT(DISTINCT JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.roundId'))) AS n ${base} GROUP BY productKey ORDER BY n DESC, k ASC LIMIT 3`));
  const modes = rowsOf(await db.execute(sql`SELECT JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.mode')) AS k, COUNT(DISTINCT JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.roundId'))) AS n ${base} GROUP BY k ORDER BY n DESC, k ASC LIMIT 3`));
  const [first] = rowsOf(await db.execute(sql`SELECT MIN(occurredAt) AS firstTrackedAt FROM product_analytics_events WHERE eventName = 'game_answered'`));
  return { players: Number(totals?.players ?? 0), anonymousBrowsers: Number(totals?.anonymousBrowsers ?? 0), identifiedPlayers: Number(totals?.identifiedPlayers ?? 0),
    roundsStarted: Number(totals?.roundsStarted ?? 0), questionsAnswered: Number(totals?.questionsAnswered ?? 0),
    roundsCompleted: Number(completed?.n ?? 0), returningPlayers: Number(returning?.n ?? 0),
    popularCourses: courses.map(row => ({ key: String(row.k), rounds: Number(row.n) })),
    popularModes: modes.map(row => ({ key: String(row.k), rounds: Number(row.n) })),
    firstTrackedAt: first?.firstTrackedAt ? new Date(first.firstTrackedAt as string | Date).toISOString() : null };
}
