import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ENV } from "./_core/env";
import type { LearningIdentity } from "./_core/learningIdentity";
import { resolveCourseKey } from "../shared/courseRegistry";

const manifestSchema = z.object({
  version: z.literal(1), sessionId: z.string().uuid(), owner: z.string(),
  courseKey: z.string(), bankKey: z.string(), examType: z.string(),
  questionNums: z.array(z.number().int().positive()).min(1).max(100),
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
    count: course.courseKey === "oit-ww" ? 50 : 100,
    duration: course.courseKey === "oit-ww" ? 3600 : course.courseKey === "electrician-309a" ? 14400 : 10800,
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
export function issueMockSession(input: Omit<MockManifest, "version" | "sessionId" | "startedAt" | "deadline"> & { duration: number }, now = Date.now()) {
  const { duration, ...rest } = input;
  const manifest = manifestSchema.parse({ ...rest, version: 1, sessionId: randomUUID(), startedAt: now, deadline: now + duration * 1000 });
  const spec = mockSpecification(manifest.courseKey);
  const required = manifest.preview ? 30 : spec.count;
  if (manifest.questionNums.length !== required || new Set(manifest.questionNums).size !== required
    || spec.bankKey !== manifest.bankKey || spec.examType !== manifest.examType || duration !== spec.duration
    || (manifest.preview && !["oit", "oit-ww"].includes(manifest.courseKey))) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "A complete, valid exam is required." });
  }
  const payload = Buffer.from(JSON.stringify(manifest)).toString("base64url");
  return { manifest, token: `${payload}.${mac(payload).toString("base64url")}` };
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
