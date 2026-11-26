import { and, asc, eq, lte, sql } from "drizzle-orm";
import { interactiveDailyActivity, interactiveItemProgress } from "../drizzle/schema";
import { getDb } from "./db";

/**
 * Saved game results and replay-misses scheduling.
 *
 * Boxes run from 0 (missed, review now) to 4 (solid). A miss sends an item back to box 0.
 * A correct answer moves it up one box and pushes its next review further out.
 * Only signed-in accounts and verified email-code students are saved. Anonymous play is never stored.
 */
export const BOX_COUNT = 5;
/** Days until an item is due again, by box. Box 0 is due immediately. */
export const BOX_DAYS = [0, 1, 3, 7, 14] as const;
/** Box 3 and above counts as solid. */
export const SOLID_BOX = 3;
export const DAILY_GOAL = 20;
export const MAX_RESULTS_PER_CALL = 50;
export const MAX_REVIEW_ITEMS = 50;

const DAY_MS = 24 * 60 * 60 * 1000;

/** The learner key is "user:<id>" for an account, "email:<address>" for a verified email student, else null. */
export function learnerKeyFrom(ctx: { user?: { id: number } | null; studentEmail?: string | null }): string | null {
  if (ctx.user && Number.isInteger(ctx.user.id)) return `user:${ctx.user.id}`;
  const email = ctx.studentEmail?.trim().toLowerCase();
  return email ? `email:${email}`.slice(0, 330) : null;
}

export interface ItemProgress {
  attempts: number;
  correctCount: number;
  box: number;
  lastCorrect: boolean;
  dueAt: Date;
}

/** The next saved state after one answer. Pure: pass `now` in. */
export function nextProgress(prev: Pick<ItemProgress, "attempts" | "correctCount" | "box"> | null, correct: boolean, now: Date): ItemProgress {
  const box = correct ? Math.min(BOX_COUNT - 1, (prev?.box ?? 0) + 1) : 0;
  return {
    attempts: (prev?.attempts ?? 0) + 1,
    correctCount: (prev?.correctCount ?? 0) + (correct ? 1 : 0),
    box,
    lastCorrect: correct,
    dueAt: new Date(now.getTime() + BOX_DAYS[box] * DAY_MS),
  };
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export function isValidLocalDate(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

/**
 * The local date the learner says it is, accepted only within one day of the server's UTC date.
 * That covers every time zone and stops a client from filing activity far in the past or future.
 */
export function acceptLocalDate(claimed: string | undefined, now: Date): string {
  const utc = now.toISOString().slice(0, 10);
  if (!claimed || !isValidLocalDate(claimed)) return utc;
  const diff = Math.abs(new Date(`${claimed}T00:00:00Z`).getTime() - new Date(`${utc}T00:00:00Z`).getTime());
  return diff <= DAY_MS ? claimed : utc;
}

/** Consecutive active days ending today, or ending yesterday if today has no activity yet. */
export function streakDays(activeDates: readonly string[], today: string): number {
  const set = new Set(activeDates);
  const step = (iso: string, days: number) => new Date(new Date(`${iso}T00:00:00Z`).getTime() + days * DAY_MS).toISOString().slice(0, 10);
  let cursor = set.has(today) ? today : step(today, -1);
  let count = 0;
  while (set.has(cursor)) { count++; cursor = step(cursor, -1); }
  return count;
}

export interface AnswerResult { itemId: string; mode: string; correct: boolean }

export interface ModeProgress { mode: string; seen: number; solid: number; due: number; attempts: number; correct: number }
export interface ProgressSummary {
  today: { answered: number; correct: number; goal: number };
  streakDays: number;
  dueCount: number;
  modes: ModeProgress[];
}

/** Saves a batch of answers. Items must already be validated as belonging to the course. */
export async function saveResults(learnerKey: string, courseKey: string, results: readonly AnswerResult[], localDate: string, now = new Date()) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  if (results.length === 0) return { saved: 0 };
  // Each item update is an atomic upsert, including first-ever concurrent answers.
  // Keep the entire batch and its daily counters in one transaction: no partial saves.
  await db.transaction(async tx => {
    for (const result of results) {
      const first = nextProgress(null, result.correct, now);
      const nextBox = result.correct ? sql`LEAST(4, ${interactiveItemProgress.box} + 1)` : sql`0`;
      // Explicit SQL order is important; Drizzle otherwise uses schema column order
      // (box precedes dueAt), which would advance a correct answer twice for scheduling.
      await tx.execute(sql`INSERT INTO ${interactiveItemProgress}
        (learnerKey, courseKey, itemId, mode, attempts, correctCount, box, lastCorrect, lastAttemptAt, dueAt)
        VALUES (${learnerKey}, ${courseKey}, ${result.itemId}, ${result.mode}, 1, ${result.correct ? 1 : 0}, ${first.box}, ${result.correct}, ${now}, ${first.dueAt})
        ON DUPLICATE KEY UPDATE
          mode = ${result.mode},
          attempts = attempts + 1,
          correctCount = correctCount + ${result.correct ? 1 : 0},
          dueAt = TIMESTAMPADD(DAY, CASE ${nextBox} WHEN 0 THEN 0 WHEN 1 THEN 1 WHEN 2 THEN 3 WHEN 3 THEN 7 ELSE 14 END, ${now}),
          box = ${nextBox}, lastCorrect = ${result.correct}, lastAttemptAt = ${now}`);
    }
    const correct = results.filter(r => r.correct).length;
    await tx.insert(interactiveDailyActivity).values({ learnerKey, activityDate: localDate, answered: results.length, correct })
      .onDuplicateKeyUpdate({ set: { answered: sql`${interactiveDailyActivity.answered} + ${results.length}`, correct: sql`${interactiveDailyActivity.correct} + ${correct}` } });
  });
  return { saved: results.length };
}

export async function readProgress(learnerKey: string, courseKey: string, localDate: string, now = new Date()): Promise<ProgressSummary> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const rows = await db.select().from(interactiveItemProgress)
    .where(and(eq(interactiveItemProgress.learnerKey, learnerKey), eq(interactiveItemProgress.courseKey, courseKey)));
  const byMode = new Map<string, ModeProgress>();
  let dueCount = 0;
  for (const row of rows) {
    const entry = byMode.get(row.mode) ?? { mode: row.mode, seen: 0, solid: 0, due: 0, attempts: 0, correct: 0 };
    entry.seen++;
    entry.attempts += row.attempts;
    entry.correct += row.correctCount;
    if (row.box >= SOLID_BOX) entry.solid++;
    if (row.dueAt.getTime() <= now.getTime()) { entry.due++; dueCount++; }
    byMode.set(row.mode, entry);
  }
  const days = await db.select({ date: interactiveDailyActivity.activityDate, answered: interactiveDailyActivity.answered, correct: interactiveDailyActivity.correct })
    .from(interactiveDailyActivity).where(eq(interactiveDailyActivity.learnerKey, learnerKey));
  const today = days.find(day => day.date === localDate);
  return {
    today: { answered: today?.answered ?? 0, correct: today?.correct ?? 0, goal: DAILY_GOAL },
    streakDays: streakDays(days.filter(day => day.answered > 0).map(day => day.date), localDate),
    dueCount,
    modes: Array.from(byMode.values()).sort((a, b) => a.mode.localeCompare(b.mode)),
  };
}

/** Items to replay for one mode: due items first, weakest box first, then oldest due. */
export async function dueItemIds(learnerKey: string, courseKey: string, mode: string, limit = MAX_REVIEW_ITEMS, now = new Date()): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ itemId: interactiveItemProgress.itemId }).from(interactiveItemProgress)
    .where(and(
      eq(interactiveItemProgress.learnerKey, learnerKey), eq(interactiveItemProgress.courseKey, courseKey),
      eq(interactiveItemProgress.mode, mode), lte(interactiveItemProgress.dueAt, now),
    ))
    .orderBy(asc(interactiveItemProgress.box), asc(interactiveItemProgress.dueAt))
    .limit(Math.min(limit, MAX_REVIEW_ITEMS));
  return rows.map(row => row.itemId);
}
