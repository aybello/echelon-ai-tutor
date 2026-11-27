import type { AssessmentActivityItem } from "./assessmentActivity";
export type LearnerSelection = { userId: number } | { email: string };
export type LearnerOption = { key: string; selection: LearnerSelection; name: string | null; email: string | null };
export type LearnerActivityItem = {
  key: string; at: Date;
  kind: "signin" | "study" | "practice" | "mock" | "math" | "diagnostic" | "tutor" | "game";
  label: string; course: string | null; detail: string;
  correct?: number; total?: number; activeSeconds?: number;
};
export type LearnerActivityMetrics = {
  signIns: number; studySessions: number; practiceRuns: number; mockExams: number;
  diagnostics: number; tutorSessions: number; gameAnswers: number; gameRoundsCompleted: number;
  courses: string[];
};
export type LearnerActivityFeed = {
  items: LearnerActivityItem[]; lastObservedAt: Date | null; recordedStudySeconds: number;
  partial: boolean; since: Date; until: Date; metrics: LearnerActivityMetrics;
};
export type LearnerCohortComparison = {
  cohortSize: number;
  excludedSelectedLearner: boolean;
  scope: "identified learners with supported activity records";
  average: { practiceRuns: number; mockExams: number; tutorSessions: number; gameAnswers: number | null; gameRoundsCompleted: number | null };
};
export type LearnerAssessmentSummary = {
  sessionId: string; courseKey: string; mode: string; timed: boolean | null;
  source: "observed"; status: string; startedAt: string; lastObservedAt: string;
  itemCount: number; eventCount: number; answers: number; retries: number;
  steps: number; hints: number; explanations: number; resumes: number;
  participated: boolean;
  activeSeconds: null;
};
export type LearnerAssessmentFeed = {
  sessions: LearnerAssessmentSummary[]; partial: boolean; since: string; until: string;
  access: { source: "recorded assignment"; status: string; courses: string[]; startsAt: string; endsAt: string } | null;
};
export type LearnerAssessmentDetail = {
  sessionId: string; items: AssessmentActivityItem[] | null;
  events: { sequence: number; action: string; itemId: string | null; stepId: string | null;
    chosenAnswer: string | null; observedCorrect: boolean | null; source: "observed";
    occurredAt: string; firstRecordedAnswer: boolean }[];
  nextCursor: number | null;
};
export type LearnerAssessmentTarget = { kind: "admin"; learner: LearnerSelection }
  | { kind: "annual"; orgId: number; memberId: number }
  | { kind: "flex"; orgId: number; licenceId: number };
export const LEARNER_ASSESSMENT_COVERAGE = "Observed actions are not verified scores or exam-readiness evidence. First recorded answer means the first submitted answer in this ledger, not necessarily the learner’s first-ever choice. Retries and step outcomes remain observations. Explanations shown do not prove they were read. Earlier interaction history and reliable active assessment time are unavailable. Canonical saved results remain separate; no historical question text or first answers are reconstructed.";
export const LEARNER_ACTIVITY_COVERAGE = "Sign-in tracking starts after this release; older history is incomplete. Privacy opt-outs and unrecorded activity are not shown. Account history uses recorded account IDs; email-only history is separate and does not establish an account name. Study tools are non-assessment. Study time covers recorded sessions started in the selected window, not total time online. No logout or session duration is inferred. Game activity is linked only when the server has a verified account or email identity; anonymous browser activity remains aggregate-only. Game correctness is not stored in this timeline.";
