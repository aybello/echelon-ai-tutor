import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { readVerifiedEmailFromRequest } from "./emailSession";
import { readAssessmentOnlySession, type AssessmentOnlyCapability } from "./assessmentOnlySession";
import { normalizeEmail, resolveEntitlementsByEmail } from "./access";
import { identityEmail, resolveVerifiedIdentity } from "./accessService";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  /** Email verified from the echelon_dashboard_session httpOnly cookie.
   *  Set when a student has completed OTP login or paid via Stripe.
   *  Never trusts client-provided input. */
  studentEmail: string | null;
  /** Server-verified, purpose-bound assessment-only capability. */
  assessmentOnlySession?: AssessmentOnlyCapability | null;
  /** Computed for verified learner identities so applicant OTP sessions fail closed. */
  assessmentOnlyHasLearnerAccess?: boolean;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  let studentEmail: string | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch {
    user = null;
  }

  // Read the verified Echelon email session cookie.
  // Fails closed: returns null when JWT_SECRET is missing or cookie is invalid/expired.
  studentEmail = await readVerifiedEmailFromRequest(opts.req);
  let assessmentOnlySession = await readAssessmentOnlySession(opts.req);
  const verifiedEmail = identityEmail(resolveVerifiedIdentity({ user, studentEmail } as TrpcContext));
  // A capability belongs to one applicant identity. Once a different verified
  // learner identity is established, the old cookie must not affect context or
  // learner guards for that learner.
  if (assessmentOnlySession && verifiedEmail && normalizeEmail(verifiedEmail) !== assessmentOnlySession.candidateEmail) {
    opts.res.clearCookie("echelon_assessment_only", { path: "/" });
    assessmentOnlySession = null;
  }
  // Applicant possession is not a learner login, even if this email later buys
  // access. Manager-only access also does not authorize learner state.
  const assessmentOnlyHasLearnerAccess = assessmentOnlySession
    ? !!verifiedEmail && normalizeEmail(verifiedEmail) === assessmentOnlySession.candidateEmail
      && (await resolveEntitlementsByEmail(verifiedEmail)).unlockedExamTypes.length > 0
    : undefined;

  return {
    req: opts.req,
    res: opts.res,
    user,
    studentEmail,
    assessmentOnlySession,
    assessmentOnlyHasLearnerAccess,
  };
}
