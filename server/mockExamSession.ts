import { createHmac, randomUUID, timingSafeEqual, createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ENV } from "./_core/env";
import type { LearningIdentity } from "./_core/learningIdentity";
import { resolveCourseKey } from "../shared/courseRegistry";

const manifestSchema = z.object({
  version: z.union([z.literal(1), z.literal(2)]), sessionId: z.string().uuid(), owner: z.string(),
  courseKey: z.string(), bankKey: z.string(), examType: z.string(),
  questionNums: z.array(z.number().int().positive()).min(1).max(110),
  scoring: z.string().optional(),
  preview: z.boolean(), startedAt: z.number(), deadline: z.number(),
});
export type MockManifest = z.infer<typeof manifestSchema>;
// A bounded transport grace allows a timer-triggered submission to reach the
// server. Already persisted results can be retried after this window.
export const MOCK_SUBMISSION_GRACE_MS = 5 * 60_000;

export function mockSpecification(courseKey: string) {
  const course = resolveCourseKey(courseKey);
  if (!course?.isActive) throw new TRPCError({ code: "BAD_REQUEST", message: "Unknown mock exam course." });
  return {
    courseKey: course.courseKey, bankKey: course.questionBankKey,
    examType: course.courseKey === "class1-water" ? "class1" : course.courseKey,
    count: course.courseKey === "oit-ww" ? 50 : course.courseKey === "wpi-class4-wastewater" ? 110 : 100,
    scoredCount: course.courseKey === "oit-ww" ? 50 : 100,
    duration: course.courseKey === "oit-ww" ? 3600 : course.courseKey === "electrician-309a" ? 14400 : 10800,
  };
}

/**
 * The active-exam response must be display-safe. Correct answers and
 * explanations are deliberately excluded until the server has finalized the
 * signed attempt; client-side code must never score an in-progress mock.
 */
export function activeMockQuestion<T extends {
  id: number; module: string; question: string; options: string[];
  diagramId?: string | null; diagramAlt?: string | null;
}>(question: T) {
  return {
    id: question.id,
    module: question.module,
    question: question.question,
    options: question.options,
    diagramId: question.diagramId,
    diagramAlt: question.diagramAlt,
  };
}

function signingKey() {
  if (!ENV.cookieSecret) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Exam session signing is unavailable." });
  return ENV.cookieSecret;
}
function mac(value: string) {
  return createHmac("sha256", signingKey()).update("echelon-mock-session-v1:" + value).digest();
}
export function mockOwner(identity: Pick<LearningIdentity, "userId" | "studentEmail">) {
  // Hide identifying details in the browser-held manifest, and allow the same
  // verified email to continue across OAuth/OTP sign-in methods.
  const value = identity.studentEmail?.trim().toLowerCase();
  return mac(value ? `email:${value}` : identity.userId ? `user:${identity.userId}` : "guest").toString("base64url");
}
export function issueMockSession(input: Omit<MockManifest, "version" | "sessionId" | "startedAt" | "deadline"> & { duration: number; unscoredQuestionNums?: number[] }, now = Date.now()) {
  const { duration, unscoredQuestionNums = [], ...rest } = input;
  const manifest = manifestSchema.parse({ ...rest, version: 2, sessionId: randomUUID(), startedAt: now, deadline: now + duration * 1000 });
  const spec = mockSpecification(manifest.courseKey);
  const required = manifest.preview ? 30 : spec.count;
  if (manifest.questionNums.length !== required || new Set(manifest.questionNums).size !== required
    || spec.bankKey !== manifest.bankKey || spec.examType !== manifest.examType || duration !== spec.duration
    || (manifest.preview && !["oit", "oit-ww"].includes(manifest.courseKey))) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "A complete, valid exam is required." });
  }
  const expectedUnscored = manifest.preview ? 0 : spec.count - spec.scoredCount;
  if (unscoredQuestionNums.length !== expectedUnscored || new Set(unscoredQuestionNums).size !== expectedUnscored
    || unscoredQuestionNums.some(id => !manifest.questionNums.includes(id))) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid scoring plan." });
  }
  if (expectedUnscored) {
    // HMAC signatures do not conceal payloads. Encrypt the pre-test identities so
    // a learner cannot decode the token and skip the ten unscored questions.
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", scoringKey(), iv);
    cipher.setAAD(Buffer.from(manifest.sessionId));
    const ciphertext = Buffer.concat([cipher.update(JSON.stringify(unscoredQuestionNums)), cipher.final()]);
    manifest.scoring = Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString("base64url");
  }
  const payload = Buffer.from(JSON.stringify(manifest)).toString("base64url");
  return { manifest, token: `${payload}.${mac(payload).toString("base64url")}` };
}
function scoringKey() {
  return createHash("sha256").update("echelon-mock-scoring-v2:" + signingKey()).digest();
}
export function scoredMockQuestionNums(manifest: MockManifest): number[] {
  if (manifest.version === 1) return manifest.questionNums; // Already issued exams retain their scoring.
  const expected = manifest.courseKey === "wpi-class4-wastewater" && !manifest.preview ? 10 : 0;
  if (!expected && !manifest.scoring) return manifest.questionNums;
  if (!expected || !manifest.scoring) throw new Error("Invalid scoring plan");
  const data = Buffer.from(manifest.scoring, "base64url");
  const decipher = createDecipheriv("aes-256-gcm", scoringKey(), data.subarray(0, 12));
  decipher.setAAD(Buffer.from(manifest.sessionId));
  decipher.setAuthTag(data.subarray(12, 28));
  const ids = z.array(z.number().int().positive()).length(expected).parse(JSON.parse(
    Buffer.concat([decipher.update(data.subarray(28)), decipher.final()]).toString()));
  if (new Set(ids).size !== expected || ids.some(id => !manifest.questionNums.includes(id))) throw new Error("Invalid scoring plan");
  return manifest.questionNums.filter(id => !ids.includes(id));
}
export function verifyMockSession(token: string, owner: string): MockManifest {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) throw new Error("format");
    const expected = mac(parts[0]);
    const actual = Buffer.from(parts[1], "base64url");
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new Error("signature");
    const manifest = manifestSchema.parse(JSON.parse(Buffer.from(parts[0], "base64url").toString()));
    if (manifest.owner !== owner) throw new Error("owner");
    scoredMockQuestionNums(manifest);
    return manifest;
  } catch {
    throw new TRPCError({ code: "BAD_REQUEST", message: "This exam session is invalid or belongs to another learner. Start a new exam." });
  }
}
export function validateMockSubmission(manifest: MockManifest, input: {
  sessionId: string; examType: string; bankKey: string; calcOnly?: boolean;
  answers: { questionNum: number }[];
}) {
  if (input.sessionId !== manifest.sessionId || input.examType !== manifest.examType
    || input.bankKey !== manifest.courseKey || input.calcOnly) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "The submission does not match the issued exam." });
  }
  const ids = input.answers.map(a => a.questionNum);
  if (new Set(ids).size !== ids.length || ids.length !== manifest.questionNums.length
    || ids.some(id => !manifest.questionNums.includes(id))) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Every issued exam question must appear exactly once, including unanswered questions." });
  }
}

/** Server-side weighted sampling; question IDs/counts never come from the browser. */
export function selectMockQuestions<T extends { id: number; module: string }>(pool: T[], targets: Record<string, number>, count: number, random = Math.random): T[] {
  const shuffled = [...new Map(pool.map(q => [q.id, q])).values()];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const selected: T[] = [];
  for (const [module, target] of Object.entries(targets)) {
    if (!Number.isFinite(target) || target < 0) continue;
    selected.push(...shuffled.filter(q => q.module === module).slice(0, Math.floor(target)));
  }
  const seen = new Set(selected.map(q => q.id));
  selected.push(...shuffled.filter(q => !seen.has(q.id)));
  return selected.slice(0, count);
}
