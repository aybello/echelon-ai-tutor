/**
 * "What next" suggestion shown after a quiz, Quick 10 or mock exam.
 *
 * One pure function holds every rule, so the order of the rules is easy to read and to test.
 * The first rule that matches wins. The server gathers the inputs from data that already
 * exists (streaks, missed questions, topic accuracy, exam date, mock exam history) and calls
 * this function. The browser only turns the returned action into a button.
 */

export const NEXT_STEP_MISSED_MINIMUM = 5;
export const NEXT_STEP_WEAK_TOPIC_BELOW_PERCENT = 70;
export const NEXT_STEP_WEAK_TOPIC_MIN_ATTEMPTS = 10;
export const NEXT_STEP_EXAM_WITHIN_DAYS = 14;
export const NEXT_STEP_MOCK_RECENT_DAYS = 7;

export type NextStepRule = "streak" | "missed" | "weak-topic" | "mock-exam" | "quick-10";

/** What the button does. The browser maps this to a page, using the learner's course. */
export type NextStepAction =
  | { type: "question-of-the-day" }
  | { type: "missed-questions" }
  | { type: "topic-practice"; module: string }
  | { type: "mock-exam" }
  | { type: "quick-10" };

export interface NextStepInput {
  /** Days in a row the learner has practised, counting up to yesterday or today. */
  currentStreakDays: number;
  /** True once the learner has answered at least one question today (their own calendar day). */
  practisedToday: boolean;
  /** Questions whose most recent attempt was wrong, in the current course. */
  missedQuestionCount: number;
  /** Accuracy and attempt counts per module in the current course. */
  modules: ReadonlyArray<{ name: string; attempts: number; correct: number }>;
  /** Whole days until the saved exam date, or null when there is none. Negative means it has passed. */
  daysUntilExam: number | null;
  /** Whole days since the learner last finished a mock exam in this course, or null when never. */
  daysSinceLastMock: number | null;
}

export interface NextStep {
  rule: NextStepRule;
  /** Plain-language sentence shown to the learner. */
  message: string;
  buttonLabel: string;
  action: NextStepAction;
}

/** The weakest module that qualifies for rule 3, or null. Lowest accuracy first, then more attempts. */
export function weakestModule(modules: NextStepInput["modules"]): { name: string; percent: number } | null {
  let best: { name: string; percent: number; attempts: number } | null = null;
  for (const m of modules) {
    if (!(m.attempts >= NEXT_STEP_WEAK_TOPIC_MIN_ATTEMPTS)) continue;
    const percent = (m.correct / m.attempts) * 100;
    if (!(percent < NEXT_STEP_WEAK_TOPIC_BELOW_PERCENT)) continue;
    if (!best || percent < best.percent || (percent === best.percent && m.attempts > best.attempts)) {
      best = { name: m.name, percent, attempts: m.attempts };
    }
  }
  return best ? { name: best.name, percent: best.percent } : null;
}

export function suggestNextStep(input: NextStepInput): NextStep {
  // 1. A streak is on the line today.
  if (input.currentStreakDays > 0 && !input.practisedToday) {
    return {
      rule: "streak",
      message: "Keep your streak: answer today's question.",
      buttonLabel: "Answer today's question",
      action: { type: "question-of-the-day" },
    };
  }

  // 2. A pile of missed questions is waiting.
  if (input.missedQuestionCount >= NEXT_STEP_MISSED_MINIMUM) {
    return {
      rule: "missed",
      message: `Review your ${input.missedQuestionCount} missed questions.`,
      buttonLabel: "Review missed questions",
      action: { type: "missed-questions" },
    };
  }

  // 3. One topic is clearly behind.
  const weak = weakestModule(input.modules);
  if (weak) {
    return {
      rule: "weak-topic",
      message: `Work on your weakest topic: ${weak.name}.`,
      buttonLabel: "Practise this topic",
      action: { type: "topic-practice", module: weak.name },
    };
  }

  // 4. The exam is close and there has been no recent mock exam.
  const examIsClose = input.daysUntilExam !== null && input.daysUntilExam >= 0 && input.daysUntilExam <= NEXT_STEP_EXAM_WITHIN_DAYS;
  const noRecentMock = input.daysSinceLastMock === null || input.daysSinceLastMock >= NEXT_STEP_MOCK_RECENT_DAYS;
  if (examIsClose && noRecentMock) {
    return {
      rule: "mock-exam",
      message: "Take a mock exam.",
      buttonLabel: "Start a mock exam",
      action: { type: "mock-exam" },
    };
  }

  // 5. Nothing is urgent.
  return {
    rule: "quick-10",
    message: "Nice work. Another Quick 10?",
    buttonLabel: "Start a Quick 10",
    action: { type: "quick-10" },
  };
}
