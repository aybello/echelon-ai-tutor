export interface JourneyEvent {
  eventName: string;
  occurredAt: Date;
  userId: string | null;
  emailHash: string | null;
  anonymousHash?: string | null;
  examType?: string | null;
  metadata?: string | null;
}

type JourneyIdentityFields = Pick<JourneyEvent, "userId" | "emailHash" | "anonymousHash">;

function identityKeys(event: JourneyIdentityFields): string[] {
  return [
    event.userId ? `user:${event.userId}` : null,
    event.emailHash ? `email:${event.emailHash}` : null,
    event.anonymousHash ? `anonymous:${event.anonymousHash}` : null,
  ].filter((identity): identity is string => Boolean(identity));
}

/** Best single identity for legacy callers that do not need cross-event stitching. */
export function analyticsIdentity(event: JourneyIdentityFields): string | null {
  return identityKeys(event)[0] ?? null;
}

/**
 * Connect browser, email and user identifiers when any persisted event contains
 * more than one. This keeps a journey intact when an anonymous visitor signs in
 * or gives Stripe an email address.
 */
export function buildJourneyIdentityResolver(events: JourneyEvent[]): (event: JourneyEvent) => string | null {
  const parent = new Map<string, string>();

  const find = (key: string): string => {
    const current = parent.get(key);
    if (!current) {
      parent.set(key, key);
      return key;
    }
    if (current === key) return key;
    const root = find(current);
    parent.set(key, root);
    return root;
  };

  const union = (left: string, right: string) => {
    const leftRoot = find(left);
    const rightRoot = find(right);
    if (leftRoot !== rightRoot) parent.set(rightRoot, leftRoot);
  };

  for (const event of events) {
    const keys = identityKeys(event);
    for (const key of keys) find(key);
    for (let index = 1; index < keys.length; index++) union(keys[0], keys[index]);
  }

  const preference = (key: string) => key.startsWith("user:") ? 0 : key.startsWith("email:") ? 1 : 2;
  const canonicalByRoot = new Map<string, string>();
  for (const key of parent.keys()) {
    const root = find(key);
    const current = canonicalByRoot.get(root);
    if (!current || preference(key) < preference(current) || (preference(key) === preference(current) && key < current)) {
      canonicalByRoot.set(root, key);
    }
  }

  return (event: JourneyEvent) => {
    const key = identityKeys(event)[0];
    return key ? canonicalByRoot.get(find(key)) ?? key : null;
  };
}

export function percentage(numerator: number, denominator: number): number | null {
  if (denominator <= 0) return null;
  return Math.round((numerator / denominator) * 1000) / 10;
}

export interface CohortConversion {
  rate: number | null;
  cohortSize: number;
  converted: number;
}

export interface ReturnRate {
  rate: number | null;
  eligibleLearners: number;
  returnedLearners: number;
}

/** Conversion among entrants to the named source cohort, never all target events. */
export function cohortConversion(
  events: JourneyEvent[],
  sourceEvents: ReadonlySet<string>,
  targetEvents: ReadonlySet<string>,
): CohortConversion {
  const resolveIdentity = buildJourneyIdentityResolver(events);
  const firstSourceAt = new Map<string, number>();

  for (const event of events) {
    const identity = resolveIdentity(event);
    if (!identity) continue;
    const timestamp = event.occurredAt.getTime();
    if (sourceEvents.has(event.eventName)) {
      firstSourceAt.set(identity, Math.min(firstSourceAt.get(identity) ?? timestamp, timestamp));
    }
  }

  const convertedIdentities = new Set<string>();
  for (const event of events) {
    if (!targetEvents.has(event.eventName)) continue;
    const identity = resolveIdentity(event);
    if (!identity) continue;
    const sourceAt = firstSourceAt.get(identity);
    if (sourceAt !== undefined && event.occurredAt.getTime() >= sourceAt) {
      convertedIdentities.add(identity);
    }
  }
  const converted = convertedIdentities.size;
  return {
    rate: percentage(converted, firstSourceAt.size),
    cohortSize: firstSourceAt.size,
    converted,
  };
}

/**
 * Repeat activity over two adjacent windows of equal length. Learners enter
 * the cohort only when active in the earlier window, then count as returned
 * when active again in the most recent window.
 *
 * This rolling-cohort definition works with the bounded owner KPI query. It
 * must not be presented as lifetime retention from a learner's first event.
 */
export function learningReturnRate(
  events: JourneyEvent[],
  now: Date,
  afterDays: number,
): ReturnRate {
  const resolveIdentity = buildJourneyIdentityResolver(events);
  const learningEvents = new Set([
    "diagnostic_started", "diagnostic_completed", "quiz_started", "quiz_completed",
    "mock_exam_completed", "ai_tutor_opened", "ai_tutor_message",
    "training_session_started", "training_session_completed",
  ]);
  const cohort = new Set<string>();
  const returned = new Set<string>();
  const periodMs = afterDays * 24 * 60 * 60 * 1000;
  const recentStart = now.getTime() - periodMs;
  const cohortStart = recentStart - periodMs;

  for (const event of events) {
    if (!learningEvents.has(event.eventName)) continue;
    const identity = resolveIdentity(event);
    if (!identity) continue;
    const at = event.occurredAt.getTime();
    if (at >= cohortStart && at < recentStart) cohort.add(identity);
    if (at >= recentStart && at <= now.getTime()) returned.add(identity);
  }

  const eligibleLearners = cohort.size;
  const returnedLearners = [...cohort].filter(identity => returned.has(identity)).length;
  return { rate: percentage(returnedLearners, eligibleLearners), eligibleLearners, returnedLearners };
}

/** Median elapsed minutes from signup/access activation to the first quiz start. */
export function medianTimeToFirstQuizMinutes(events: JourneyEvent[]): number | null {
  const resolveIdentity = buildJourneyIdentityResolver(events);
  const journeys = new Map<string, { start?: number; quiz?: number }>();

  for (const event of [...events].sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime())) {
    const identity = resolveIdentity(event);
    if (!identity) continue;
    const journey = journeys.get(identity) ?? {};
    const timestamp = event.occurredAt.getTime();
    if ((event.eventName === "signup" || event.eventName === "access_activated") && journey.start === undefined) {
      journey.start = timestamp;
    }
    if (
      event.eventName === "quiz_started"
      && journey.start !== undefined
      && timestamp >= journey.start
      && journey.quiz === undefined
    ) {
      journey.quiz = timestamp;
    }
    journeys.set(identity, journey);
  }

  const elapsed = Array.from(journeys.values())
    .filter((journey): journey is { start: number; quiz: number } => (
      journey.start !== undefined && journey.quiz !== undefined && journey.quiz >= journey.start
    ))
    .map(journey => (journey.quiz - journey.start) / 60_000)
    .sort((a, b) => a - b);

  if (elapsed.length === 0) return null;
  const midpoint = Math.floor(elapsed.length / 2);
  const median = elapsed.length % 2 === 0
    ? (elapsed[midpoint - 1] + elapsed[midpoint]) / 2
    : elapsed[midpoint];
  return Math.round(median * 10) / 10;
}

/**
 * Average improvement between comparable standard quiz sessions. Unlike the
 * former "mastery" metric, this never compares different quiz modes or lengths.
 */
export function comparableQuizGain(events: JourneyEvent[]): { percentagePoints: number | null; sampleSize: number } {
  const resolveIdentity = buildJourneyIdentityResolver(events);
  const completions = new Map<string, Array<{ at: number; accuracy: number }>>();

  for (const event of events) {
    if (event.eventName !== "quiz_completed" || !event.metadata) continue;
    const identity = resolveIdentity(event);
    if (!identity) continue;
    try {
      const metadata = JSON.parse(event.metadata) as {
        quizMode?: string;
        questionCount?: number;
        correctCount?: number;
      };
      if (
        metadata.quizMode !== "standard"
        || !metadata.questionCount
        || metadata.questionCount <= 0
        || metadata.correctCount === undefined
      ) continue;
      const key = `${identity}:${event.examType ?? "unknown"}:standard:${metadata.questionCount}`;
      const rows = completions.get(key) ?? [];
      rows.push({
        at: event.occurredAt.getTime(),
        accuracy: metadata.correctCount / metadata.questionCount,
      });
      completions.set(key, rows);
    } catch {
      // Ignore malformed legacy metadata instead of breaking the owner dashboard.
    }
  }

  const gains = Array.from(completions.values()).flatMap(rows => {
    if (rows.length < 2) return [];
    rows.sort((a, b) => a.at - b.at);
    return [(rows[rows.length - 1].accuracy - rows[0].accuracy) * 100];
  });
  if (gains.length === 0) return { percentagePoints: null, sampleSize: 0 };
  return {
    percentagePoints: Math.round((gains.reduce((sum, gain) => sum + gain, 0) / gains.length) * 10) / 10,
    sampleSize: gains.length,
  };
}
