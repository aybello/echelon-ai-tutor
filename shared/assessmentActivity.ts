import { z } from "zod";

/** Supplemental observations, not assessment scores, readiness, entitlement, or OJT time. */
export const assessmentActivityModes = [
  "practice", "quick10", "mock", "diagnostic", "team-diagnostic", "flex-diagnostic",
  "rapid-swipe", "speed-match", "odd-one-out", "cause-effect", "tap-the-flaw", "before-after",
  "calculation-ladder", "build-process", "find-calculation-error", "evidence-detective", "exam-escape-room",
] as const;
export const assessmentActivityModeSchema = z.enum(assessmentActivityModes);
export type AssessmentActivityMode = z.infer<typeof assessmentActivityModeSchema>;
export const assessmentActivityActions = ["issued", "started", "item_presented", "answer_submitted", "retry", "step_answer", "hint_opened", "explanation_opened", "resumed", "completed", "abandoned", "timed_out", "selection_changed", "item_skipped"] as const;
export const assessmentActivityActionSchema = z.enum(assessmentActivityActions);
export const assessmentActivityStatusSchema = z.enum(["active", "completed", "abandoned"]);
export const assessmentActivityIdentitySchema = z.enum(["user", "verified-email", "anonymous"]);
export const assessmentActivityLimits = { items: 150, steps: 24, batch: 25, events: 3000, title: 2000, prompt: 2000, options: 24, optionText: 300 } as const;
const id = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_.:-]{0,79}$/);
const option = z.object({ id, text: z.string().trim().min(1).max(300) }).strict();
const choices = z.array(option).max(24).refine(values => new Set(values.map(value => value.id)).size === values.length, "Duplicate option IDs");
const step = z.object({ id, label: z.string().trim().min(1).max(300), options: choices.default([]) }).strict();
/** Only server delivery builders may supply these snapshots. Never accept client-authored prompts or names. */
export const assessmentActivityItemSchema = z.object({
  id, title: z.string().trim().min(1).max(2000).optional(), prompt: z.string().trim().min(1).max(2000),
  topic: z.string().trim().min(1).max(128).optional(), options: choices.default([]),
  steps: z.array(step).max(24).default([]).refine(values => new Set(values.map(value => value.id)).size === values.length, "Duplicate step IDs"),
}).strict();
export const assessmentActivityIssueSchema = z.object({
  courseKey: z.string().min(1).max(64), mode: assessmentActivityModeSchema,
  timed: z.boolean().nullable().default(null),
  items: z.array(assessmentActivityItemSchema).min(1).max(150).refine(values => new Set(values.map(value => value.id)).size === values.length, "Duplicate item IDs"),
  /** Trusted builder only: an existing issued canonical session reference, already identity/course-bound by its issuer. */
  sourceSessionId: z.string().min(1).max(80).optional(),
}).strict();
export type AssessmentActivityIssue = z.input<typeof assessmentActivityIssueSchema>;
export type AssessmentActivityItem = z.infer<typeof assessmentActivityItemSchema>;
export const assessmentActivityEventSchema = z.object({
  eventId: z.string().uuid(), sequence: z.number().int().min(2).max(3000), action: assessmentActivityActionSchema,
  itemId: id.optional(), stepId: id.optional(), chosenAnswer: id.optional(),
  /** Client-observed only. A trusted canonical result must be read from the existing attempt tables. */
  observedCorrect: z.boolean().optional(),
}).strict();
export type AssessmentActivityEvent = z.infer<typeof assessmentActivityEventSchema>;
export const assessmentActivityRecordInputSchema = z.object({
  capability: z.string().min(1).max(2048), events: z.array(assessmentActivityEventSchema).min(1).max(25),
}).strict();
export const assessmentActivityResumeInputSchema = z.object({ capability: z.string().min(1).max(2048) }).strict();
export type AssessmentActivityResumeInput = z.infer<typeof assessmentActivityResumeInputSchema>;
export type AssessmentActivityRecordInput = z.infer<typeof assessmentActivityRecordInputSchema>;
export type AssessmentActivityCapability = {
  tracking: true; sessionId: string; capability: string; nextSequence: number;
  expiresAt: string; source: "observed";
};
export type AssessmentActivityNotRecorded = { tracking: false; recorded: false; source: "observed" };
export type AssessmentActivityRecordResult = AssessmentActivityNotRecorded | {
  tracking: true; recorded: true; accepted: number; duplicates: number; nextSequence: number;
  status: z.infer<typeof assessmentActivityStatusSchema>; source: "observed";
};
export type AssessmentActivityResumeResult = (AssessmentActivityCapability & { status: z.infer<typeof assessmentActivityStatusSchema> }) | AssessmentActivityNotRecorded;
/** Study tools stay in learning_activity_sessions; do not blend them into assessment readiness. */
export const assessmentActivitySourceLabels = {
  observed: "Observed learning activity (not a verified result)",
  canonical: "Historical assessment result (existing attempt records)",
  studyTools: "Study tools (non-assessment)",
} as const;
