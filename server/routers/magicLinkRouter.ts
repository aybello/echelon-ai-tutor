/**
 * Magic Link Authentication Router
 *
 * Provides passwordless email login for paying customers.
 * Flow:
 * 1. User enters email on /account page
 * 2. If they have purchases/subscriptions, a magic link is emailed
 * 3. User clicks link -> token is validated -> session is established
 *
 * KEY PRINCIPLE: The magic link URL is built from ENV.appBaseUrl (server-approved),
 * NOT from the client-supplied origin. This prevents open-redirect attacks where
 * a malicious caller could supply an arbitrary origin to redirect victims to
 * attacker-controlled domains.
 *
 * The client-supplied origin is still accepted as input (for backward compat) but
 * is ignored when building the link URL.
 */

import { z } from "zod";
import crypto from "crypto";
import { eq, and, gt, isNull } from "drizzle-orm";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { magicLinks } from "../../drizzle/schema";
import { sendMagicLinkEmail } from "../email";
import { issueSubscriptionToken } from "../_core/subscriptionToken";
import { resolveEntitlementsByEmail, normalizeEmail } from "../_core/access";
import { ENV } from "../_core/env";
import { trackEvent } from "../analytics";
import { issueVerifiedEmailSessionCookie } from "../_core/emailSession";

const MAGIC_LINK_EXPIRY_MINUTES = 15;

export const magicLinkRouter = router({
  /**
   * Request a magic link email.
   *
   * Uses resolveEntitlementsByEmail for consistent, fail-closed access checking:
   * - Refunded/disputed purchases do NOT trigger a magic link send.
   * - Expired/cancelled subscriptions do NOT trigger a magic link send.
   * - Managers (isManager) can still receive a magic link even without course entitlements.
   *
   * The magic link URL is built from ENV.appBaseUrl — the server-approved domain —
   * NOT from the client-supplied origin. The origin input is kept for backward
   * compatibility but is ignored for URL construction.
   *
   * Always returns { sent: true } to prevent email enumeration.
   */
  /**
   * @deprecated Magic link login has been replaced by email OTP (/login/otp).
   * This procedure is kept for backward compatibility (old emails in inboxes)
   * but no longer sends new magic link emails.
   * Returns { sent: true } silently — callers should migrate to emailOtp.requestOtp.
   */
  requestMagicLink: publicProcedure
    .input(z.object({
      email: z.string().email(),
      origin: z.string().url().optional(),
      next: z.string().max(200).optional(),
    }))
    .mutation(async () => {
      // DEPRECATED: Magic link login retired in favour of email OTP.
      // No new magic link emails are sent. Existing links in inboxes still work via consumeMagicLink.
      console.log("[MagicLink] requestMagicLink called but is deprecated — no email sent");
      return { sent: true };
    }),

  /**
   * Consume a magic link token.
   *
   * Validates the token, marks it as used, then re-resolves live entitlements
   * before issuing the access token. This ensures:
   * - A refunded customer who still has a valid magic link cannot regain access.
   * - A cancelled subscriber who still has a valid magic link cannot regain access.
   * - The examTypes in the access token always reflect current DB state.
   */
  consumeMagicLink: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return { valid: false, email: "", examTypes: [] as string[], accessToken: "", isManager: false };

      const now = new Date();

      // Hash the incoming token and look up by hash — the raw token is never stored
      const incomingHash = crypto.createHash("sha256").update(input.token).digest("hex");

      // Find the token by hash
      const [link] = await db
        .select()
        .from(magicLinks)
        .where(
          and(
            eq(magicLinks.tokenHash, incomingHash),
            gt(magicLinks.expiresAt, now),
            isNull(magicLinks.usedAt),
          )
        )
        .limit(1);

      if (!link) {
        return { valid: false, email: "", examTypes: [] as string[], accessToken: "", isManager: false };
      }

      // Mark as used immediately to prevent replay
      await db.update(magicLinks)
        .set({ usedAt: now })
        .where(eq(magicLinks.id, link.id));

      // Re-resolve live entitlements — do not use the stored examTypes snapshot.
      // The snapshot was taken at request time; by consume time the user may have
      // been refunded or their subscription may have lapsed.
      const entitlements = await resolveEntitlementsByEmail(link.email);

      // Only issue an access token if there are actual course entitlements
      const accessToken = entitlements.unlockedExamTypes.length > 0
        ? await issueSubscriptionToken({ email: link.email, examTypes: entitlements.unlockedExamTypes })
        : "";

      // Check if this email is a manager of any org — redirect to /team if so
      const isManager = entitlements.isManager;

      // Issue the shared verified Echelon email session cookie for ALL valid magic link consumes.
      // This is the unified session model: students, managers, and team operators all get the same
      // cookie after a valid magic link — no separate dashboard login required.
      await issueVerifiedEmailSessionCookie(ctx.res, link.email);

      trackEvent("restore_access_completed", { email: link.email });
      return {
        valid: true,
        email: link.email,
        examTypes: entitlements.unlockedExamTypes,
        accessToken,
        isManager,
      };
    }),
});
