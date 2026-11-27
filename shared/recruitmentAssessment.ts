import { z } from "zod";

export type RecruitmentDifficultyMode = "mixed" | "medium" | "hard";
export type RecruitmentDifficulty = "easy" | "medium" | "hard";
export type RecruitmentDifficultyCounts = Record<RecruitmentDifficultyMode, number>;
export function recruitmentDifficultyLabel(mode: RecruitmentDifficultyMode | null | undefined): string {
  return mode === "mixed" ? "Mixed" : mode === "medium" ? "Medium" : mode === "hard" ? "Hard" : "Not recorded";
}
/** Only authored difficulty tags count; never infer from cognitive level or another bank. */
export function normalizeRecruitmentDifficulty(value: unknown): RecruitmentDifficulty | null {
  const label = typeof value === "string" ? value.trim().toLowerCase() : null;
  return label === "easy" || label === "medium" || label === "hard" ? label : null;
}

export const RECRUITMENT_NOTICE = "This is a knowledge assessment to support a human-led recruitment process. It is not a certification exam, proof of practical competence, or an automated hiring recommendation. It is not proctored, and candidates may have previously studied these questions through their assigned team seat. The hiring team can see your submitted answers, completion time and topic scores. Timed assessments automatically record and score your saved answers when the server deadline is reached, unless the assessment invitation is revoked before that deadline. Losing your team seat or course access prevents further answers but does not cancel this automatic scoring. Contact the hiring team if your access ends while an assessment is in progress. Untimed assessments require you to submit before the invitation expires; an unsubmitted untimed assessment expires without a score. Contact the hiring team before starting if you need an accommodation.";
export const RECRUITMENT_CONSENT_VERSION = "recruitment-v1";
export const recruitmentOrgInput = z.object({ orgId: z.number().int().positive() }).strict();
export const recruitmentCreateInput = recruitmentOrgInput.extend({
  title: z.string().trim().min(3).max(160),
  courseKey: z.string().min(1).max(64),
  difficultyMode: z.enum(["mixed", "medium", "hard"]).default("mixed"),
  modules: z.array(z.string().min(1).max(160)).max(30).refine(v => new Set(v).size === v.length, "Choose each topic once.").default([]),
  questionCount: z.number().int().min(5).max(100),
  timeLimitMinutes: z.number().int().min(5).max(180).nullable(),
  expiresInDays: z.number().int().min(1).max(30),
}).strict();
export const recruitmentAssessmentInput = recruitmentOrgInput.extend({ assessmentId: z.string().uuid() }).strict();
export const recruitmentInviteInput = recruitmentAssessmentInput.extend({ memberId: z.number().int().positive() }).strict();
export const recruitmentAssignmentInput = z.object({ assignmentId: z.string().uuid() }).strict();
export const recruitmentStartInput = recruitmentAssignmentInput.extend({ acceptedNotice: z.literal(true), consentVersion: z.literal(RECRUITMENT_CONSENT_VERSION) }).strict();
export const recruitmentAnswerInput = recruitmentAssignmentInput.extend({ questionId: z.string().min(1).max(100), selectedIndex: z.number().int().min(0).max(7).nullable(), revision: z.number().int().nonnegative() }).strict();
export const recruitmentSubmitInput = recruitmentAssignmentInput.extend({ revision: z.number().int().nonnegative() }).strict();
export const recruitmentRevokeInput = recruitmentOrgInput.extend({ assignmentId: z.string().uuid(), expectedRevision: z.number().int().nonnegative() }).strict();

export type RecruitmentQuestion = { id: string; module: string; prompt: string; options: string[]; correctIndex: number; difficulty?: RecruitmentDifficulty | null };
export type RecruitmentCandidateQuestion = Omit<RecruitmentQuestion, "correctIndex">;
export type RecruitmentAnswers = Record<string, number>;
export type RecruitmentStatus = "invited" | "active" | "submitted" | "timed_out" | "expired" | "revoked";
export type RecruitmentTopicScore = { module: string; correct: number; total: number; answered: number; percent: number };
export type RecruitmentScore = { correct: number; total: number; answered: number; unanswered: number; percent: number; topics: RecruitmentTopicScore[] };

export function candidateQuestions(questions: RecruitmentQuestion[]): RecruitmentCandidateQuestion[] {
  return questions.map(q => ({ id: q.id, module: q.module, prompt: q.prompt, options: [...q.options] }));
}
export function scoreRecruitment(questions: RecruitmentQuestion[], answers: RecruitmentAnswers): RecruitmentScore {
  const groups = new Map<string, { correct: number; total: number; answered: number }>();
  let correct = 0, answered = 0;
  for (const q of questions) {
    const choice = answers[q.id];
    const hasAnswer = Number.isInteger(choice) && choice >= 0 && choice < q.options.length;
    const isCorrect = hasAnswer && choice === q.correctIndex;
    answered += Number(hasAnswer); correct += Number(isCorrect);
    const g = groups.get(q.module) ?? { correct: 0, total: 0, answered: 0 };
    g.total++; g.correct += Number(isCorrect); g.answered += Number(hasAnswer); groups.set(q.module, g);
  }
  const percent = (n: number, d: number) => d ? Math.round(n / d * 100) : 0;
  return { correct, total: questions.length, answered, unanswered: questions.length - answered, percent: percent(correct, questions.length), topics: Array.from(groups, ([module, g]) => ({ module, ...g, percent: percent(g.correct, g.total) })) };
}
export function recruitmentDeadline(startedAtMs: number | null, minutes: number | null, expiresAtMs: number): number {
  return startedAtMs !== null && minutes !== null ? Math.min(expiresAtMs, startedAtMs + minutes * 60_000) : expiresAtMs;
}
export function validRecruitmentQuestions(questions: RecruitmentQuestion[]): boolean {
  return questions.length > 0 && new Set(questions.map(q => q.id)).size === questions.length && questions.every(q => typeof q.id === "string" && !!q.id && typeof q.module === "string" && !!q.module && typeof q.prompt === "string" && !!q.prompt.trim() && Array.isArray(q.options) && q.options.length >= 2 && q.options.length <= 8 && q.options.every(o => typeof o === "string" && !!o.trim()) && Number.isInteger(q.correctIndex) && q.correctIndex >= 0 && q.correctIndex < q.options.length);
}

/** New selections only: normal HTML whitespace collapses, Unicode composition
 * matches display, but case, nonbreaking spaces and superscripts stay meaningful.
 * Historical snapshot validation/scoring must retain the original option keys. */
export function validRecruitmentSelectionQuestions(questions: RecruitmentQuestion[]): boolean {
  return validRecruitmentQuestions(questions) && questions.every(q => {
    // New answer labels must not carry invisible formatting characters. This
    // avoids indistinguishable indexed choices without editing stored evidence.
    if (q.options.some(option => /\p{Default_Ignorable_Code_Point}/u.test(option))) return false;
    const displayed = q.options.map(option => option.normalize("NFC").replace(/[\t\n\f\r ]+/g, " ").replace(/^ | $/g, ""));
    return new Set(displayed).size === displayed.length;
  });
}

/** Explicit topics all appear; automatic topics round-robin only the matching pool.
 * Mode filtering happens before coverage and availability, with no easier fallback. */
export function selectRecruitmentQuestions(pool: RecruitmentQuestion[], modules: string[], count: number, random: () => number = Math.random, difficultyMode: RecruitmentDifficultyMode = "mixed"): RecruitmentQuestion[] {
  if (!["mixed", "medium", "hard"].includes(difficultyMode)) throw new Error("Choose a valid assessment difficulty mode.");
  if (!Number.isInteger(count) || count < 1 || count > 100) throw new Error("Choose a valid assessment question count.");
  if (new Set(modules).size !== modules.length) throw new Error("Choose each topic once.");
  if (count < modules.length) throw new Error("Use at least one question per selected topic.");
  const shuffled = pool.filter(q => validRecruitmentSelectionQuestions([q])
    && (difficultyMode === "mixed" || normalizeRecruitmentDifficulty(q.difficulty) === difficultyMode));
  for (let i = shuffled.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; }
  const topics = modules.length ? modules : [...new Set(shuffled.map(q => q.module))];
  const byModule = topics.map(module => shuffled.filter(q => q.module === module));
  if (byModule.some(rows => rows.length === 0)) throw new Error(`A selected topic has no usable questions for ${recruitmentDifficultyLabel(difficultyMode)} mode.`);
  if (byModule.reduce((n, rows) => n + rows.length, 0) < count) throw new Error(`Not enough usable questions for ${recruitmentDifficultyLabel(difficultyMode)} mode. Choose fewer questions, more topics, or a different difficulty mode.`);
  const selected: RecruitmentQuestion[] = [];
  for (let index = 0; selected.length < count; index++) {
    for (const rows of byModule) { if (rows[index] && selected.length < count) selected.push(rows[index]); }
  }
  if (!validRecruitmentSelectionQuestions(selected)) throw new Error("The selected questions are invalid.");
  return selected;
}

export type RecruitmentCatalog = { orgName: string; courses: { courseKey: string; label: string; difficultyCounts?: RecruitmentDifficultyCounts; unlabelledCount?: number; modules: { name: string; count: number; difficultyCounts?: RecruitmentDifficultyCounts }[] }[]; candidates: { memberId: number; email: string; name: string | null; courseKeys: string[] }[] };
export type RecruitmentDefinitionSummary = { id: string; title: string; courseKey: string; courseLabel: string; difficultyMode?: RecruitmentDifficultyMode | null; modules: string[]; questionCount: number; timeLimitMinutes: number | null; createdAtMs: number; expiresAtMs: number; candidates: number; completed: number };
export type RecruitmentResult = { assignmentId: string; memberId: number; candidateEmail: string; candidateName: string | null; status: RecruitmentStatus; startedAtMs: number | null; submittedAtMs: number | null; expiresAtMs: number; score: RecruitmentScore | null; answers: RecruitmentAnswers; questions: RecruitmentQuestion[]; revision: number };
export type RecruitmentCandidateView = { assignmentId: string; title: string; orgName: string; courseLabel: string; difficultyMode?: RecruitmentDifficultyMode | null; modules: string[]; questionCount: number; timeLimitMinutes: number | null; expiresAtMs: number; deadlineMs: number; serverNowMs: number; startedAtMs: number | null; submittedAtMs: number | null; status: RecruitmentStatus; questions: RecruitmentCandidateQuestion[]; answers: RecruitmentAnswers; revision: number; notice: string };
