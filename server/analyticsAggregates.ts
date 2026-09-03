import { and, asc, count, gt, gte, inArray } from "drizzle-orm";
import { productAnalyticsEvents } from "../drizzle/schema";
import type { getDb } from "./db";
import type { JourneyEvent } from "./productKpis";

type Database = NonNullable<Awaited<ReturnType<typeof getDb>>>;

export const TRAINING_METRIC_EVENT_NAMES = [
  "training_session_started",
  "training_session_completed",
  "training_hours_exported",
  "training_record_attested",
] as const;

export type TrainingMetricEventName = typeof TRAINING_METRIC_EVENT_NAMES[number];

export const PRODUCT_KPI_JOURNEY_EVENT_NAMES = [
  "signup",
  "pricing_viewed",
  "checkout_completed",
  "access_activated",
  "diagnostic_started",
  "diagnostic_completed",
  "quiz_started",
  "quiz_completed",
  "mock_exam_completed",
  "ai_tutor_opened",
  "ai_tutor_message",
  "training_session_started",
  "training_session_completed",
  "subscription_renewed",
  "subscription_cancelled",
] as const;

/**
 * Read every event needed by the owner KPI cohorts using keyset pagination.
 * This stays exact after 100,000 monthly events without a single unbounded
 * database response or an oldest-first cap that silently drops new activity.
 */
export async function getAllProductKpiJourneyEvents(
  db: Database,
  since: Date,
  batchSize = 25_000,
): Promise<JourneyEvent[]> {
  if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 25_000) {
    throw new Error("Analytics batch size must be an integer from 1 to 25,000.");
  }

  const events: JourneyEvent[] = [];
  let afterId = 0;

  while (true) {
    const rows = await db
      .select({
        id: productAnalyticsEvents.id,
        eventName: productAnalyticsEvents.eventName,
        occurredAt: productAnalyticsEvents.occurredAt,
        userId: productAnalyticsEvents.userId,
        emailHash: productAnalyticsEvents.emailHash,
        anonymousHash: productAnalyticsEvents.anonymousHash,
        examType: productAnalyticsEvents.examType,
        metadata: productAnalyticsEvents.metadata,
      })
      .from(productAnalyticsEvents)
      .where(and(
        gte(productAnalyticsEvents.occurredAt, since),
        gt(productAnalyticsEvents.id, afterId),
        inArray(productAnalyticsEvents.eventName, [...PRODUCT_KPI_JOURNEY_EVENT_NAMES]),
      ))
      .orderBy(asc(productAnalyticsEvents.id))
      .limit(batchSize);

    for (const { id: _id, ...event } of rows) events.push(event);
    if (rows.length < batchSize) break;

    const nextId = Number(rows[rows.length - 1]?.id ?? afterId);
    if (nextId <= afterId) {
      throw new Error("Analytics pagination did not advance.");
    }
    afterId = nextId;
  }

  return events;
}

/**
 * Count every matching event in the requested period. This query is separate
 * from the bounded journey-analysis sample so dashboard totals cannot freeze
 * or omit newer activity after that sample reaches its safety cap.
 */
export async function getExactAnalyticsEventCounts(
  db: Database,
  since: Date,
  eventNames: readonly TrainingMetricEventName[] = TRAINING_METRIC_EVENT_NAMES,
) {
  if (eventNames.length === 0) return new Map<TrainingMetricEventName, number>();

  const rows = await db
    .select({
      eventName: productAnalyticsEvents.eventName,
      total: count(),
    })
    .from(productAnalyticsEvents)
    .where(and(
      gte(productAnalyticsEvents.occurredAt, since),
      inArray(productAnalyticsEvents.eventName, [...eventNames]),
    ))
    .groupBy(productAnalyticsEvents.eventName);

  return new Map(
    rows.map(row => [row.eventName as TrainingMetricEventName, Number(row.total)]),
  );
}
