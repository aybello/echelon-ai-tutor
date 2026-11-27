import { z } from "zod";

export const RECRUITMENT_NOTICE = "This is a knowledge assessment to support a human-led recruitment process. It is not a certification exam, proof of practical competence, or an automated hiring recommendation. It is not proctored, and candidates may have previously studied these questions through their assigned team seat. The hiring team can see your answers, completion time and topic scores. Contact the hiring team before starting if you need an accommodation.";
export const RECRUITMENT_CONSENT_VERSION = "recruitment-v1";
export const recruitmentOrgInput = z.object({ orgId: z.number().int().positive() }).strict();
export const recruitmentCreateInput = recruitmentOrgInput.extend({
  title: z.string().trim().min(3).max(160),
  courseKey: z.string().min(1).max(64),
  modules: z.array(z.string().min(1).max(160)).min(1).max(30).refine(v => new Set(v).size === v.length, "Choose each topic once."),
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
export const recruitmentRevokeInput = recruitmentOrgInput.extend({ assignmentId: z.string().uuid() }).strict();

export type RecruitmentQuestion = { id: string; module: string; prompt: string; options: string[]; correctIndex: number };
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

/** Round-robin coverage after a server-side shuffle. Every chosen topic must appear. */
export function selectRecruitmentQuestions(pool: RecruitmentQuestion[], modules: string[], count: number, random: () => number = Math.random): RecruitmentQuestion[] {
  if (count < modules.length) throw new Error("Use at least one question per selected topic.");
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; }
  const byModule = modules.map(module => shuffled.filter(q => q.module === module));
  if (byModule.some(rows => rows.length === 0)) throw new Error("A selected topic has no usable questions.");
  if (byModule.reduce((n, rows) => n + rows.length, 0) < count) throw new Error("Not enough usable questions for this assessment. Choose fewer questions or more topics.");
  const selected: RecruitmentQuestion[] = [];
  for (let index = 0; selected.length < count; index++) {
    for (const rows of byModule) { if (rows[index] && selected.length < count) selected.push(rows[index]); }
  }
  if (!validRecruitmentQuestions(selected)) throw new Error("The selected questions are invalid.");
  return selected;
}

export type RecruitmentCatalog = { orgName: string; courses: { courseKey: string; label: string; modules: { name: string; count: number }[] }[]; candidates: { memberId: number; email: string; name: string | null; courseKeys: string[] }[] };
export type RecruitmentDefinitionSummary = { id: string; title: string; courseKey: string; courseLabel: string; modules: string[]; questionCount: number; timeLimitMinutes: number | null; createdAtMs: number; expiresAtMs: number; candidates: number; completed: number };
export type RecruitmentResult = { assignmentId: string; memberId: number; candidateEmail: string; candidateName: string | null; status: RecruitmentStatus; startedAtMs: number | null; submittedAtMs: number | null; expiresAtMs: number; score: RecruitmentScore | null; answers: RecruitmentAnswers; questions: RecruitmentQuestion[]; revision: number };
export type RecruitmentCandidateView = { assignmentId: string; title: string; orgName: string; courseLabel: string; modules: string[]; questionCount: number; timeLimitMinutes: number | null; expiresAtMs: number; deadlineMs: number; serverNowMs: number; startedAtMs: number | null; submittedAtMs: number | null; status: RecruitmentStatus; questions: RecruitmentCandidateQuestion[]; answers: RecruitmentAnswers; revision: number; notice: string };
