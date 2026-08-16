export interface JourneyEvent {
  eventName: string;
  occurredAt: Date;
  userId: string | null;
  emailHash: string | null;
  examType?: string | null;
  metadata?: string | null;
}

export function analyticsIdentity(event: Pick<JourneyEvent, "userId" | "emailHash">): string | null {
  if (event.userId) return `user:${event.userId}`;
  if (event.emailHash) return `email:${event.emailHash}`;
  return null;
}

export function percentage(numerator: number, denominator: number): number | null {
  if (denominator <= 0) return null;
  return Math.round((numerator / denominator) * 1000) / 10;
}

/** Median elapsed minutes from signup/access activation to the first quiz start. */
export function medianTimeToFirstQuizMinutes(events: JourneyEvent[]): number | null {
  const journeys = new Map<string, { start?: number; quiz?: number }>();

  for (const event of [...events].sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime())) {
    const identity = analyticsIdentity(event);
    if (!identity) continue;
    const journey = journeys.get(identity) ?? {};
    const timestamp = event.occurredAt.getTime();
    if ((event.eventName === "signup" || event.eventName === "access_activated") && journey.start === undefined) {
      journey.start = timestamp;
    }
    if (event.eventName === "quiz_started" && journey.quiz === undefined) {
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

/** Average first-to-latest quiz accuracy change for learner/course pairs. */
export function masteryGain(events: JourneyEvent[]): { percentagePoints: number | null; sampleSize: number } {
  const completions = new Map<string, Array<{ at: number; accuracy: number }>>();
  for (const event of events) {
    if (event.eventName !== "quiz_completed" || !event.metadata) continue;
    const identity = analyticsIdentity(event);
    if (!identity) continue;
    try {
      const metadata = JSON.parse(event.metadata) as { questionCount?: number; correctCount?: number };
      if (!metadata.questionCount || metadata.questionCount <= 0 || metadata.correctCount === undefined) continue;
      const key = `${identity}:${event.examType ?? "unknown"}`;
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
