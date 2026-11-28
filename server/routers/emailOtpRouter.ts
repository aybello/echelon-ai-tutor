import { recordLearnerSignIn } from "../learnerSignIn";
/**
 * Email OTP Router — 6-digit one-time passcode login for org operators.
 *
 * Flow:
 *   1. Operator enters their email at /login/otp
 *   2. requestOtp: resolves entitlements, generates a 6-digit code, stores SHA-256 hash,
 *      sends the code via email. Unknown emails receive a neutral success response;
 *      delivery failures return a generic error.
 *   3. Operator types the code into the UI.
 *   4. verifyOtp: checks hash, checks expiry, checks attempt count (max 5),
 *      marks used, issues session cookie + localStorage token, returns access data.
 *
 * Security properties:
 *   - Code is never stored in plaintext (SHA-256 hash only)
 *   - Single-use (usedAt set on first successful verify)
 *   - 10-minute expiry
 *   - Max 5 wrong attempts per code (brute-force protection)
 *   - Returns neutral response on requestOtp to prevent email enumeration
 */

import crypto from "crypto";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, gt, inArray, isNull } from "drizzle-orm";
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { emailOtpCodes, recruitmentAssignments } from "../../drizzle/schema";
import { resolveEntitlementsByEmail } from "../_core/access";
import { normalizeEmail } from "../_core/access";
import { issueSubscriptionToken } from "../_core/subscriptionToken";
import { clearVerifiedEmailSessionCookie, issueVerifiedEmailSessionCookie } from "../_core/emailSession";
import { clearAssessmentOnlySessionCookie } from "../_core/assessmentOnlySession";
import { clearIdentityCookies } from "../_core/logout";
import { issueApplicantCapabilityForOtp } from "../recruitment/service";
import { sendOtpEmail } from "../email";
import { trackEvent } from "../analytics";  // server/analytics.ts
import { hasRecoverableTeamBilling } from "../teams/billingIdentity";
import { verifyAndConsumeOtp } from "../auth/atomicVerification";

const OTP_EXPIRY_MINUTES = 10;

function generateOtpCode(): string {
  // Cryptographically random 6-digit code (000000–999999)
  const num = crypto.randomInt(0, 1_000_000);
  return num.toString().padStart(6, "0");
}

function hashCode(code: string, assignmentId?: string): string {
  // Bind the stored verifier too: the same code cannot be presented for a
  // different invitation or downgraded into an unbound general login.
  return crypto.createHash("sha256").update(assignmentId ? `recruitment:${assignmentId}:${code}` : code).digest("hex");
}

export const emailOtpRouter = router({
  /**
   * Request a 6-digit OTP code for the given email.
   * Returns a neutral success for unknown emails to prevent enumeration. For an
   * entitled email, success means the SMTP provider accepted the message.
   */
  requestOtp: publicProcedure
    .input(z.object({ email: z.string().email(), assignmentId: z.string().uuid().optional() }))
    .mutation(async ({ input }) => {
      const email = normalizeEmail(input.email);

      // Billing identity survives paid-content expiry, but grants no learner access.
      const entitlements = await resolveEntitlementsByEmail(email);
      const db = await getDb();
      const [applicantInvitation] = db
        ? await db.select({ id: recruitmentAssignments.id }).from(recruitmentAssignments).where(and(
          eq(recruitmentAssignments.candidateEmail, email),
          eq(recruitmentAssignments.accessKind, "applicant"),
          inArray(recruitmentAssignments.status, ["invited", "active"]),
          gt(recruitmentAssignments.expiresAtMs, Date.now()),
          input.assignmentId ? eq(recruitmentAssignments.id, input.assignmentId) : undefined,
        )).orderBy(desc(recruitmentAssignments.createdAtMs), desc(recruitmentAssignments.id)).limit(1)
        : [];
      if (!entitlements.hasAnyAccess && !entitlements.isManager && !applicantInvitation && !(await hasRecoverableTeamBilling(email))) {
        console.log(`[OTP] No entitlements for ${email.replace(/(^.{3}).+@/, "$1***@")}`);
        return { sent: true };
      }

      if (!db) return { sent: true };

      // Generate code and store hash
      const code = generateOtpCode();
      const codeHash = hashCode(code, input.assignmentId);
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

      // A resend replaces every older unused code. This prevents the verifier
      // from accepting a stale code after the learner asks for a new one.
      await db
        .update(emailOtpCodes)
        .set({ usedAt: new Date() })
        .where(and(eq(emailOtpCodes.email, email), isNull(emailOtpCodes.usedAt)));

      await db.insert(emailOtpCodes).values({ email, codeHash, expiresAt });

      // Do not tell the browser that a code was sent until the SMTP provider
      // has accepted it. The previous fire-and-forget call could be terminated
      // with the request and silently strand managers on the code-entry screen.
      try {
        await sendOtpEmail({ email, code, expiresInMinutes: OTP_EXPIRY_MINUTES });
      } catch (error) {
        // Never leave an undelivered code valid in the database.
        await db
          .delete(emailOtpCodes)
          .where(and(
            eq(emailOtpCodes.email, email),
            eq(emailOtpCodes.codeHash, codeHash),
            isNull(emailOtpCodes.usedAt),
          ));
        console.error("[OTP] Failed to send email:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "We couldn't send your login code. Please try again in a moment.",
          cause: error,
        });
      }

      console.log(`[OTP] Code sent to ${email.replace(/(^.{3}).+@/, "$1***@")}`);
      return { sent: true };
    }),

  /**
   * Verify a 6-digit OTP code.
   * On success: issues session cookie + returns access token and exam types.
   * On failure: returns { valid: false, reason }.
   */
  verifyOtp: publicProcedure
    .input(z.object({
      email: z.string().email(),
      code: z.string().length(6).regex(/^\d{6}$/),
      assignmentId: z.string().uuid().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const email = normalizeEmail(input.email);
      // An unverified attempt must not erase the current identity/capability:
      // making the next request anonymous could enable another learner's token.
      const db = await getDb();
      if (!db) return { valid: false as const, reason: "server_error" as const };

      const verification = await verifyAndConsumeOtp(db, emailOtpCodes, email, hashCode(input.code, input.assignmentId));
      if (!verification.valid) return verification;

      try {
        // Resolve live entitlements
        const entitlements = await resolveEntitlementsByEmail(email);
        const isManager = entitlements.isManager || await hasRecoverableTeamBilling(email);
        // Independently entitled learners/managers keep ordinary login (including
        // training-seat links); their verified identity can bootstrap the exact
        // requested applicant invitation on arrival without a capability switch.
        const applicantOnly = !entitlements.hasAnyAccess && !isManager;
        // Consuming this OTP deliberately switches the browser's identity.
        // End the old OAuth session too, or createContext would prefer it and
        // discard the newly issued applicant capability on the next request.
        // Keep normal context precedence for genuinely later independent logins.
        clearIdentityCookies(ctx.req, ctx.res);
        if (applicantOnly) {
          try {
            // The issuer signs and clears cookies inside its transaction. Buffer
            // both operations so a failed commit cannot expose a signed cookie,
            // even alongside a later deletion in the same response headers.
            const cookieWrites: Array<() => void> = [];
            const stagedResponse = {
              cookie: (...args: Parameters<typeof ctx.res.cookie>) => {
                cookieWrites.push(() => ctx.res.cookie(...args));
                return stagedResponse;
              },
              clearCookie: (...args: Parameters<typeof ctx.res.clearCookie>) => {
                cookieWrites.push(() => ctx.res.clearCookie(...args));
                return stagedResponse;
              },
            } as typeof ctx.res;
            // The consumed OTP proves this email, not any older OAuth/cookie identity.
            // The issuer rechecks live scope and deadlines while holding its locks.
            await issueApplicantCapabilityForOtp({
              req: ctx.req, res: stagedResponse, user: null, studentEmail: email, assessmentOnlySession: null,
            }, input.assignmentId);
            for (const writeCookie of cookieWrites) writeCookie();
          } catch (error) {
            // This OTP was consumed: failed authorization still invalidates the
            // old applicant state, but no uncommitted new capability is emitted.
            clearVerifiedEmailSessionCookie(ctx.res);
            clearAssessmentOnlySessionCookie(ctx.res);
            throw new TRPCError({ code: "FORBIDDEN", message: "This invitation is no longer available.", cause: error });
          }
        } else {
          clearAssessmentOnlySessionCookie(ctx.res);
          await issueVerifiedEmailSessionCookie(ctx.res, email);
        }

        const examTypes = applicantOnly ? [] : entitlements.unlockedExamTypes;
        const accessToken = examTypes.length > 0 ? await issueSubscriptionToken({ email, examTypes }) : "";
        if (!applicantOnly) {
          await trackEvent("otp_verified", { email });
          await recordLearnerSignIn(ctx.req, { email }, "email_otp");
        }

        return {
          valid: true as const,
          sessionKind: applicantOnly ? "assessment-only" as const : "verified-email" as const,
          email,
          examTypes,
          accessToken,
          // This directs billing owners to their team page; course access stays live-only.
          isManager,
        };
      } catch (error) {
        clearVerifiedEmailSessionCookie(ctx.res);
        clearAssessmentOnlySessionCookie(ctx.res);
        throw error;
      }
    }),
});
