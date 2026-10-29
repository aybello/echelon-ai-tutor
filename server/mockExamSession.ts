import { createHmac, randomUUID, timingSafeEqual, createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { brotliCompressSync, brotliDecompressSync, constants as zlibConstants } from "node:zlib";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ENV } from "./_core/env";
import type { LearningIdentity } from "./_core/learningIdentity";
import { resolveCourseKey } from "../shared/courseRegistry";
import {
  TEXAS_CLASS_D_WATER_COURSE_KEY,
  TEXAS_CLASS_D_WATER_MOCK_DURATION_SECONDS,
  TEXAS_CLASS_D_WATER_MOCK_QUESTIONS,
} from "../shared/texasClassD";

const manifestSchema = z.object({
  version: z.union([z.literal(1), z.literal(2), z.literal(3)]), sessionId: z.string().uuid(), owner: z.string(),
  courseKey: z.string(), bankKey: z.string(), examType: z.string(),
  questionNums: z.array(z.number().int().positive()).min(1).max(110),
  scoring: z.string().optional(),
  issuedSnapshot: z.string().min(1).max(50_000).optional(),
  attribution: z.object({ orgId: z.number().int().positive().nullable(), organizationMemberId: z.number().int().positive().nullable(), flexLicenceId: z.number().int().positive().nullable() }).optional(),
  preview: z.boolean(), startedAt: z.number(), deadline: z.number(),
});
export type MockManifest = z.infer<typeof manifestSchema>;
const issuedMockQuestionSchema = z.object({
  questionNum: z.number().int().positive(),
  module: z.string().min(1).max(128),
  topic: z.string().max(128).nullable(),
  difficulty: z.string().max(16).nullable(),
  question: z.string().min(1).max(20_000),
  options: z.array(z.string().min(1).max(20_000)).length(4),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string().max(30_000).nullable(),
  steps: z.array(z.object({ l: z.string().max(1_000), c: z.string().max(20_000) })).max(50).nullable(),
  tip: z.string().max(10_000).nullable(),
  isCalc: z.boolean(),
});
export type IssuedMockQuestion = z.infer<typeof issuedMockQuestionSchema>;
const issuedMockSnapshotSchema = z.object({
  version: z.literal(1),
  questions: z.array(issuedMockQuestionSchema).min(1).max(110),
});
const MAX_MOCK_SESSION_TOKEN_LENGTH = 64_000;
const MAX_ISSUED_SNAPSHOT_BYTES = 512_000;
// A bounded transport grace allows a timer-triggered submission to reach the
// server. Already persisted results can be retried after this window.
export const MOCK_SUBMISSION_GRACE_MS = 5 * 60_000;

function mockRuntimeSettingsForCourseKey(courseKey: string) {
  const isTexasClassD = courseKey === TEXAS_CLASS_D_WATER_COURSE_KEY;
  return {
    count: isTexasClassD ? TEXAS_CLASS_D_WATER_MOCK_QUESTIONS : courseKey === "oit-ww" ? 50 : courseKey === "wpi-class4-wastewater" ? 110 : 100,
    scoredCount: isTexasClassD ? TEXAS_CLASS_D_WATER_MOCK_QUESTIONS : courseKey === "oit-ww" ? 50 : 100,
    duration: isTexasClassD ? TEXAS_CLASS_D_WATER_MOCK_DURATION_SECONDS : courseKey === "oit-ww" ? 3600 : courseKey === "electrician-309a" ? 14400 : 10800,
  };
}

export function mockSpecification(courseKey: string) {
  const course = resolveCourseKey(courseKey);
  if (!course?.isActive) throw new TRPCError({ code: "BAD_REQUEST", message: "Unknown mock exam course." });
  return {
    courseKey: course.courseKey, bankKey: course.questionBankKey,
    examType: course.courseKey === "class1-water" ? "class1" : course.courseKey,
    ...mockRuntimeSettingsForCourseKey(course.courseKey),
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
function snapshotKey() {
  return createHash("sha256").update("echelon-mock-issued-snapshot-v1:" + signingKey()).digest();
}
function encryptIssuedSnapshot(sessionId: string, questions: IssuedMockQuestion[]) {
  const serialized = Buffer.from(JSON.stringify({ version: 1, questions }));
  if (serialized.length > MAX_ISSUED_SNAPSHOT_BYTES) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "This mock exam is temporarily unavailable because its issued review context is too large." });
  }
  const compressed = brotliCompressSync(serialized, {
    params: { [zlibConstants.BROTLI_PARAM_QUALITY]: 6 },
  });
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", snapshotKey(), iv);
  cipher.setAAD(Buffer.from(sessionId));
  const ciphertext = Buffer.concat([cipher.update(compressed), cipher.final()]);
  const snapshot = Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString("base64url");
  if (snapshot.length > 50_000) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "This mock exam is temporarily unavailable because its issued review context is too large." });
  }
  return snapshot;
}
function decryptIssuedSnapshot(manifest: MockManifest): IssuedMockQuestion[] {
  if (!manifest.issuedSnapshot) throw new Error("Missing issued snapshot");
  const data = Buffer.from(manifest.issuedSnapshot, "base64url");
  if (data.length < 29) throw new Error("Invalid issued snapshot");
  const decipher = createDecipheriv("aes-256-gcm", snapshotKey(), data.subarray(0, 12));
  decipher.setAAD(Buffer.from(manifest.sessionId));
  decipher.setAuthTag(data.subarray(12, 28));
  const compressed = Buffer.concat([decipher.update(data.subarray(28)), decipher.final()]);
  const snapshot = issuedMockSnapshotSchema.parse(JSON.parse(brotliDecompressSync(compressed, {
    maxOutputLength: MAX_ISSUED_SNAPSHOT_BYTES,
  }).toString()));
  if (snapshot.questions.length !== manifest.questionNums.length
    || snapshot.questions.some((question, index) => question.questionNum !== manifest.questionNums[index])
    || new Set(snapshot.questions.map(question => question.questionNum)).size !== snapshot.questions.length) {
    throw new Error("Issued snapshot does not match session");
  }
  return snapshot.questions;
}
export function mockOwner(identity: Pick<LearningIdentity, "userId" | "studentEmail">) {
  // Hide identifying details in the browser-held manifest, and allow the same
  // verified email to continue across OAuth/OTP sign-in methods.
  const value = identity.studentEmail?.trim().toLowerCase();
  return mac(value ? `email:${value}` : identity.userId ? `user:${identity.userId}` : "guest").toString("base64url");
}
export function issueMockSession(input: Omit<MockManifest, "version" | "sessionId" | "startedAt" | "deadline" | "issuedSnapshot"> & { duration: number; unscoredQuestionNums?: number[]; issuedQuestions?: IssuedMockQuestion[] }, now = Date.now()) {
  const { duration, unscoredQuestionNums = [], issuedQuestions, ...rest } = input;
  const manifest = manifestSchema.parse({ ...rest, version: issuedQuestions ? 3 : 2, sessionId: randomUUID(), startedAt: now, deadline: now + duration * 1000 });
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
  if (issuedQuestions) {
    const parsedQuestions = issuedMockSnapshotSchema.parse({ version: 1, questions: issuedQuestions }).questions;
    if (parsedQuestions.length !== manifest.questionNums.length
      || parsedQuestions.some((question, index) => question.questionNum !== manifest.questionNums[index])
      || new Set(parsedQuestions.map(question => question.questionNum)).size !== parsedQuestions.length) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Issued question context does not match the exam." });
    }
    manifest.issuedSnapshot = encryptIssuedSnapshot(manifest.sessionId, parsedQuestions);
  }
  const payload = Buffer.from(JSON.stringify(manifest)).toString("base64url");
  const token = `${payload}.${mac(payload).toString("base64url")}`;
  if (token.length > MAX_MOCK_SESSION_TOKEN_LENGTH) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "This mock exam is temporarily unavailable because its issued review context is too large." });
  }
  return { manifest, token };
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
/** Returns the server-decryptable immutable question context for newly issued mocks. */
export function issuedMockQuestions(manifest: MockManifest): IssuedMockQuestion[] | null {
  return manifest.version === 3 ? decryptIssuedSnapshot(manifest) : null;
}

/**
 * A review permit is minted only by submitMock after the complete signed exam
 * has been finalized. It contains no answer data and remains bound to the
 * learner-owned encrypted session snapshot.
 */
export function issueMockReviewToken(manifest: MockManifest) {
  const payload = Buffer.from(JSON.stringify({ sessionId: manifest.sessionId, owner: manifest.owner, courseKey: manifest.courseKey })).toString("base64url");
  return `${payload}.${mac(`review:${payload}`).toString("base64url")}`;
}
export function verifyMockReviewContext(sessionToken: string, reviewToken: string, owner: string) {
  const manifest = verifyMockSession(sessionToken, owner);
  try {
    const [payload, signature, ...extra] = reviewToken.split(".");
    if (!payload || !signature || extra.length) throw new Error("format");
    const expected = mac(`review:${payload}`);
    const actual = Buffer.from(signature, "base64url");
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new Error("signature");
    const permit = z.object({ sessionId: z.string().uuid(), owner: z.string(), courseKey: z.string() }).parse(JSON.parse(Buffer.from(payload, "base64url").toString()));
    if (permit.sessionId !== manifest.sessionId || permit.owner !== manifest.owner || permit.courseKey !== manifest.courseKey) throw new Error("binding");
    return manifest;
  } catch {
    throw new TRPCError({ code: "BAD_REQUEST", message: "This answer review is invalid or belongs to another learner." });
  }
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
    issuedMockQuestions(manifest);
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

/** Exact reviewed area quotas. Ambiguous chapters never count as coverage. */
export function selectMappedMockQuestions<T extends { id: number; module: string }>(
  pool: readonly T[], targets: Readonly<Record<string, number>>, count: number,
  areaForQuestion: (question: T) => string | null, random = Math.random,
): T[] {
  const entries = Object.entries(targets);
  if (!Number.isInteger(count) || count < 1 || entries.length === 0
    || entries.some(([area, quota]) => !area || !Number.isInteger(quota) || quota < 0)
    || entries.reduce((sum, [, quota]) => sum + quota, 0) !== count) {
    throw new Error("Invalid mapped mock blueprint");
  }
  const ids = new Set<number>();
  const buckets = new Map(entries.map(([area]) => [area, [] as T[]]));
  for (const question of pool) {
    if (!Number.isInteger(question.id) || question.id <= 0 || ids.has(question.id)) {
      throw new Error("Duplicate or invalid mock question identity");
    }
    ids.add(question.id);
    const area = areaForQuestion(question);
    if (area) buckets.get(area)?.push(question);
  }
  // Validate all coverage before random selection. Never borrow another area's
  // questions, and never let two mappings give one question two quota credits.
  for (const [area, quota] of entries) {
    if (buckets.get(area)!.length < quota) throw new Error(`Insufficient reviewed coverage for ${area}`);
  }
  const selected = entries.flatMap(([area, quota]) => selectMockQuestions(buckets.get(area)!, {}, quota, random));
  return selectMockQuestions(selected, {}, count, random);
}
