import { and, count, gte, inArray } from "drizzle-orm";
import { productAnalyticsEvents } from "../drizzle/schema";
import type { getDb } from "./db";

type Database = NonNullable<Awaited<ReturnType<typeof getDb>>>;

export const TRAINING_METRIC_EVENT_NAMES = [
  "training_session_started",
  "training_session_completed",
  "training_hours_exported",
  "training_record_attested",
] as const;

export type TrainingMetricEventName = typeof TRAINING_METRIC_EVENT_NAMES[number];

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
