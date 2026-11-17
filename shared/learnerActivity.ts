export type LearnerSelection = { userId: number } | { email: string };
export type LearnerOption = { key: string; selection: LearnerSelection; name: string | null; email: string | null };
export type LearnerActivityItem = {
  key: string;
  at: Date;
  kind: "signin" | "study" | "practice" | "mock" | "math" | "diagnostic" | "tutor";
  label: string;
  course: string | null;
  detail: string;
  correct?: number;
  total?: number;
  activeSeconds?: number;
};
export type LearnerActivityFeed = {
  items: LearnerActivityItem[];
  lastObservedAt: Date | null;
  recordedStudySeconds: number;
  partial: boolean;
  since: Date;
  until: Date;
};
export const LEARNER_ACTIVITY_COVERAGE = "Sign-in tracking starts after this release; older history is incomplete. Privacy opt-outs and unrecorded activity are not shown. Account history uses recorded account IDs; email-only history is separate and does not establish an account name. Study time covers recorded sessions started in the selected window, not total time online. No logout or session duration is inferred. Named game activity is not available; existing game reports remain aggregate and separate.";
