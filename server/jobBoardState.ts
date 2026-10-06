import { createHash } from "node:crypto";
import { sql } from "drizzle-orm";
import { getDb } from "./db";

// No settings table exists at this baseline. Dedicated scheduled_work keys hold
// compact outcome JSON in lastError, never learner/email/provider payloads.
export const JOB_HEALTH_KEY = "job-board:refresh-health";
export const JOB_REFRESH_LOCK_KEY = "job-board:refresh-lock";
export const jobSourceStateKey = (source: string) => `job-board:source:${createHash("sha256").update(source).digest("hex")}`;
export const vacancyStateKey = (url: string) => `job-board:vacancy:${createHash("sha256").update(url).digest("hex")}`;
export function assertJobStateKey(key: string) {
  if (key !== JOB_HEALTH_KEY && !/^job-board:(?:source|vacancy):[a-f0-9]{64}$/.test(key)) throw new Error("Invalid Jobs telemetry namespace");
}
export type JobSourceOutcome = { source: string; status: "success" | "failed" | "degraded"; count: number; lastAttemptAt: string; lastSuccessAt: string | null };
export type JobRefreshHealth = { runStartedAt: string; runCompletedAt: string | null; status: "running" | "complete" | "degraded" | "failed"; lastSuccessAt: string | null; sources: JobSourceOutcome[]; successfulSources: number; failedSources: number; productiveTiers: number; provinceCount: number };
export function mergeSourceOutcomes(previous: JobSourceOutcome[], incoming: Array<{ source: string; status: "success" | "failed" | "degraded"; count: number }>, at: string): JobSourceOutcome[] {
  const current = incoming.map(item => ({ ...item, lastAttemptAt: at, lastSuccessAt: item.status === "success" ? at : previous.find(old => old.source === item.source)?.lastSuccessAt ?? null }));
  return [...current, ...previous.filter(old => !incoming.some(item => item.source === old.source)).map(old => ({ ...old, status: "degraded" as const, count: 0 }))];
}
const validDate = (value: unknown): value is string => typeof value === "string" && Number.isFinite(Date.parse(value));
export function parseJobRefreshHealth(text: string): JobRefreshHealth | null {
  try {
    const value = JSON.parse(text);
    if (!value || !validDate(value.runStartedAt) || !["running", "complete", "degraded", "failed"].includes(value.status) ||
        !(value.runCompletedAt === null || validDate(value.runCompletedAt)) || !(value.lastSuccessAt === null || validDate(value.lastSuccessAt)) ||
        !["successfulSources", "failedSources", "productiveTiers", "provinceCount"].every(key => Number.isInteger(value[key]) && value[key] >= 0) ||
        !Array.isArray(value.sources) || !value.sources.every((source: JobSourceOutcome) => source && typeof source.source === "string" && ["success", "failed", "degraded"].includes(source.status) && Number.isInteger(source.count) && source.count >= 0 && validDate(source.lastAttemptAt) && (source.lastSuccessAt === null || validDate(source.lastSuccessAt)))) return null;
    return value as JobRefreshHealth;
  } catch { return null; }
}
export function summarizeJobHealth(health: JobRefreshHealth | null, now = new Date()) {
  const lastRefreshedAt = validDate(health?.runCompletedAt) ? new Date(health.runCompletedAt) : null;
  const coverageComplete = health?.status === "complete";
  const age = lastRefreshedAt ? now.getTime() - lastRefreshedAt.getTime() : Infinity;
  return { lastRefreshedAt, lastSuccessfulRefreshAt: validDate(health?.lastSuccessAt) ? new Date(health.lastSuccessAt) : null, refreshStatus: health?.status ?? "unknown", refreshedSourceCount: health?.successfulSources ?? 0, failedSourceCount: health?.failedSources ?? 0, expectedSourceCount: health?.sources.length ?? 0, coverageComplete, isStale: !coverageComplete || age < 0 || age > 6 * 60 * 60 * 1000 };
}
export async function readJobRefreshHealth(db: NonNullable<Awaited<ReturnType<typeof getDb>>>) {
  const [rows] = await db.execute(sql`SELECT lastError FROM scheduled_work WHERE workKey = ${JOB_HEALTH_KEY}`) as any;
  return rows[0]?.lastError ? parseJobRefreshHealth(rows[0].lastError) : null;
}
/** Fail closed on quarantine and deadlines, but unknown legacy records remain until verified by a controlled refresh. */
export function publicJobVerificationCondition(sourceUrl: unknown) {
  const closingAt = sql`JSON_UNQUOTE(JSON_EXTRACT(CASE WHEN JSON_VALID(job_state.lastError) THEN job_state.lastError ELSE '{}' END, '$.closingAt'))`;
  return sql`NOT EXISTS (SELECT 1 FROM scheduled_work job_state WHERE job_state.workKey = CONCAT('job-board:vacancy:', SHA2(${sourceUrl}, 256)) AND (job_state.status = 'quarantined' OR (${closingAt} <> 'null' AND ${closingAt} <> '' AND ${closingAt} <= ${new Date().toISOString()})))`;
}

/** Dates are taken from source verification, never a legacy synthetic refresh timestamp. */
export function publicJobPostedAt(sourceUrl: unknown) {
  return sql<Date | string | null>`(SELECT NULLIF(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(CASE WHEN JSON_VALID(job_state.lastError) THEN job_state.lastError ELSE '{}' END, '$.postedAt')), 'null'), '') FROM scheduled_work job_state WHERE job_state.workKey = CONCAT('job-board:vacancy:', SHA2(${sourceUrl}, 256)) LIMIT 1)`;
}
