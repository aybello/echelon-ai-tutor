/**
 * Email OTP Router — 6-digit one-time passcode login for org operators.
 *
 * Flow:
 *   1. Operator enters their email at /login/otp
 *   2. requestOtp: resolves entitlements, generates a 6-digit code, stores SHA-256 hash,
 *      sends the code via email. Returns { sent: true } always (no enumeration).
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
import { and, eq, gt, isNull } from "drizzle-orm";
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { emailOtpCodes } from "../../drizzle/schema";
import { resolveEntitlementsByEmail } from "../_core/access";
import { normalizeEmail } from "../_core/access";
import { issueSubscriptionToken } from "../_core/subscriptionToken";
import { issueVerifiedEmailSessionCookie } from "../_core/emailSession";
import { sendOtpEmail } from "../email";
import { trackEvent } from "../analytics";  // server/analytics.ts

const OTP_EXPIRY_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;

function generateOtpCode(): string {
  // Cryptographically random 6-digit code (000000–999999)
  const num = crypto.randomInt(0, 1_000_000);
  return num.toString().padStart(6, "0");
}

function hashCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

export const emailOtpRouter = router({
  /**
   * Request a 6-digit OTP code for the given email.
   * Always returns { sent: true } to prevent email enumeration.
   */
  requestOtp: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const email = normalizeEmail(input.email);

      // Resolve entitlements — only send a code if the email has access or is a manager
      const entitlements = await resolveEntitlementsByEmail(email);
      if (!entitlements.hasAnyAccess && !entitlements.isManager) {
        console.log(`[OTP] No entitlements for ${email.replace(/(^.{3}).+@/, "$1***@")}`);
        return { sent: true };
      }

      const db = await getDb();
      if (!db) return { sent: true };

      // Generate code and store hash
      const code = generateOtpCode();
      const codeHash = hashCode(code);
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

      await db.insert(emailOtpCodes).values({ email, codeHash, expiresAt });

      // Send email (non-blocking)
      sendOtpEmail({ email, code, expiresInMinutes: OTP_EXPIRY_MINUTES }).catch((err) => {
        console.error("[OTP] Failed to send email:", err.message);
      });

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
    }))
    .mutation(async ({ input, ctx }) => {
      const email = normalizeEmail(input.email);
      const db = await getDb();
      if (!db) return { valid: false as const, reason: "server_error" };

      const now = new Date();
      const incomingHash = hashCode(input.code);

      // Find the most recent unused, unexpired code for this email
      const [otpRow] = await db
        .select()
        .from(emailOtpCodes)
        .where(
          and(
            eq(emailOtpCodes.email, email),
            isNull(emailOtpCodes.usedAt),
            gt(emailOtpCodes.expiresAt, now),
          )
        )
        .orderBy(emailOtpCodes.createdAt)
        .limit(1);

      if (!otpRow) {
        return { valid: false as const, reason: "expired" };
      }

      // Check attempt count
      if (otpRow.attempts >= OTP_MAX_ATTEMPTS) {
        return { valid: false as const, reason: "too_many_attempts" };
      }

      // Wrong code — increment attempts
      if (otpRow.codeHash !== incomingHash) {
        await db
          .update(emailOtpCodes)
          .set({ attempts: otpRow.attempts + 1 })
          .where(eq(emailOtpCodes.id, otpRow.id));
        const remaining = OTP_MAX_ATTEMPTS - otpRow.attempts - 1;
        return { valid: false as const, reason: "wrong_code", attemptsRemaining: remaining };
      }

      // Correct code — mark as used
      await db
        .update(emailOtpCodes)
        .set({ usedAt: now })
        .where(eq(emailOtpCodes.id, otpRow.id));

      // Resolve live entitlements
      const entitlements = await resolveEntitlementsByEmail(email);

      // Issue access token if there are course entitlements
      const accessToken =
        entitlements.unlockedExamTypes.length > 0
          ? await issueSubscriptionToken({ email, examTypes: entitlements.unlockedExamTypes })
          : "";

      // Issue verified email session cookie (same as magic link flow)
      await issueVerifiedEmailSessionCookie(ctx.res, email);

      trackEvent("otp_verified", { email });

      return {
        valid: true as const,
        email,
        examTypes: entitlements.unlockedExamTypes,
        accessToken,
        isManager: entitlements.isManager,
      };
    }),
});
