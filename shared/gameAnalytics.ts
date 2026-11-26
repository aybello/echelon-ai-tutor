import { z } from "zod";

/** No answers, correctness, names, emails or client identity claims. */
export const gameActivityInputSchema = z.object({
  capability: z.string().min(1).max(12000),
  visitorId: z.string().uuid(),
  round: z.number().int().min(0).max(100),
  timed: z.boolean(),
  event: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("answer"), itemId: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/), sequence: z.number().int().min(0).max(10000) }).strict(),
    z.object({ kind: z.literal("complete") }).strict(),
  ]),
}).strict();
export type GamePlayEvent = {
  round: number;
  timed: boolean;
  event: z.infer<typeof gameActivityInputSchema>["event"];
};
export type GameActivitySummary = {
  players: number;
  anonymousBrowsers: number;
  identifiedPlayers: number;
  returningPlayers: number;
  roundsStarted: number;
  roundsCompleted: number;
  questionsAnswered: number;
  popularCourses: { key: string; rounds: number }[];
  popularModes: { key: string; rounds: number }[];
  firstTrackedAt: string | null;
};
