import type { Request, Response } from "express";
import { SignJWT, jwtVerify } from "jose";
import { z } from "zod";
import { ENV } from "./env";
import { normalizeEmail } from "./access";
import type { TrpcContext } from "./context";
import { TRPCError } from "@trpc/server";

export const ASSESSMENT_ONLY_COOKIE = "echelon_assessment_only";
const PURPOSE = "assessment-only";
const DEFAULT_TTL_MS = 30 * 60 * 1000;
const claimsSchema = z.object({
  typ: z.literal(PURPOSE),
  assignmentId: z.string().uuid(),
  candidateEmail: z.string().email(),
  courseKey: z.string().min(1).max(64),
  exp: z.number().int().positive(),
}).strict();
export type AssessmentOnlyCapability = z.infer<typeof claimsSchema>;

function key(): Uint8Array {
  if (!ENV.cookieSecret) throw new Error("JWT_SECRET is required for assessment-only sessions");
  return new TextEncoder().encode(ENV.cookieSecret);
}

export async function issueAssessmentOnlySession(
  res: Response,
  input: { assignmentId: string; candidateEmail: string; courseKey: string; ttlMs?: number },
): Promise<AssessmentOnlyCapability> {
  const candidateEmail = normalizeEmail(input.candidateEmail);
  const exp = Math.floor((Date.now() + (input.ttlMs ?? DEFAULT_TTL_MS)) / 1000);
  const claims = claimsSchema.parse({ typ: PURPOSE, assignmentId: input.assignmentId, candidateEmail, courseKey: input.courseKey, exp });
  const token = await new SignJWT(claims).setProtectedHeader({ alg: "HS256" })
    .setIssuedAt().setExpirationTime(exp).sign(key());
  res.cookie(ASSESSMENT_ONLY_COOKIE, token, { httpOnly: true, secure: ENV.isProduction, sameSite: "lax", maxAge: Math.max(0, exp * 1000 - Date.now()), path: "/" });
  return claims;
}

export function clearAssessmentOnlySessionCookie(res: Response): void {
  res.clearCookie(ASSESSMENT_ONLY_COOKIE, { path: "/" });
}

export function assessmentOnlyCapabilityMatches(capability: AssessmentOnlyCapability | null | undefined, input: { assignmentId: string; candidateEmail: string; courseKey: string }): boolean {
  return !!capability && capability.assignmentId === input.assignmentId
    && capability.candidateEmail === normalizeEmail(input.candidateEmail)
    && capability.courseKey === input.courseKey;
}

export async function readAssessmentOnlySession(req: Request): Promise<AssessmentOnlyCapability | null> {
  if (!ENV.cookieSecret) return null;
  try {
    const token = (req as any).cookies?.[ASSESSMENT_ONLY_COOKIE];
    if (!token || typeof token !== "string") return null;
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    const claims = claimsSchema.parse({
      typ: payload.typ,
      assignmentId: payload.assignmentId,
      candidateEmail: payload.candidateEmail,
      courseKey: payload.courseKey,
      exp: payload.exp,
    });
    if (claims.exp <= Math.floor(Date.now() / 1000)) return null;
    return claims;
  } catch { return null; }
}

export function assertLearnerStateAllowed(ctx: { assessmentOnlySession?: unknown; assessmentOnlyHasLearnerAccess?: boolean; user?: unknown; studentEmail?: string | null }): void {
  // A real identity does not itself prove learning entitlement. The request
  // context computes this only for assessment-only sessions, preserving normal
  // authenticated learners while isolating applicants from learner state.
  if (ctx.assessmentOnlySession && ctx.assessmentOnlyHasLearnerAccess !== true) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Assessment-only sessions cannot access learner state." });
  }
}
