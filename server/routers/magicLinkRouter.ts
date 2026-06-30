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
import { magicLinks, organizations } from "../../drizzle/schema";
import { sendMagicLinkEmail } from "../email";
import { issueSubscriptionToken } from "../_core/subscriptionToken";
import { resolveEntitlementsByEmail, normalizeEmail } from "../_core/access";
import { SignJWT } from "jose";
import { ENV } from "../_core/env";

const DASHBOARD_COOKIE = "echelon_dashboard_session";
const DASHBOARD_JWT_SECRET = new TextEncoder().encode(ENV.cookieSecret);

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
  requestMagicLink: publicProcedure
    .input(z.object({
      email: z.string().email(),
      origin: z.string().url().optional(), // accepted but ignored for URL construction
    }))
    .mutation(async ({ input }) => {
      const email = normalizeEmail(input.email);

      // Re-resolve live entitlements — single source of truth
      const entitlements = await resolveEntitlementsByEmail(email);

      if (!entitlements.hasAnyAccess && !entitlements.isManager) {
        // No access — return success anyway to prevent email enumeration
        console.log(`[MagicLink] No entitlements found for ${email}`);
        return { sent: true };
      }

      const db = await getDb();
      if (!db) return { sent: true };

      // Generate a secure token
      const token = crypto.randomBytes(48).toString("base64url");
      const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRY_MINUTES * 60 * 1000);

      // Store the magic link with the live exam types at time of request
      await db.insert(magicLinks).values({
        email,
        token,
        examTypes: JSON.stringify(entitlements.unlockedExamTypes),
        expiresAt,
      });

      // Build the magic link URL from the server-approved base URL
      // NEVER use input.origin here — it is client-controlled and could be attacker-supplied
      const magicLinkUrl = `${ENV.appBaseUrl}/auth/magic?token=${token}`;

      // Send the email (non-blocking)
      sendMagicLinkEmail({
        email,
        magicLinkUrl,
        expiresInMinutes: MAGIC_LINK_EXPIRY_MINUTES,
      }).catch(err => {
        console.error("[MagicLink] Failed to send email:", err.message);
      });

      console.log(`[MagicLink] Sent to ${email} with ${entitlements.unlockedExamTypes.length} exam types`);
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

      // Find the token
      const [link] = await db
        .select()
        .from(magicLinks)
        .where(
          and(
            eq(magicLinks.token, input.token),
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

      // If manager, also set the dashboard session cookie so /team works immediately
      if (isManager) {
        const dashboardToken = await new SignJWT({ email: link.email, type: "dashboard" })
          .setProtectedHeader({ alg: "HS256" })
          .setIssuedAt()
          .setExpirationTime("24h")
          .sign(DASHBOARD_JWT_SECRET);
        ctx.res.cookie(DASHBOARD_COOKIE, dashboardToken, {
          httpOnly: true,
          secure: ENV.isProduction,
          sameSite: "lax",
          maxAge: 24 * 60 * 60 * 1000,
          path: "/",
        });
      }

      return {
        valid: true,
        email: link.email,
        examTypes: entitlements.unlockedExamTypes,
        accessToken,
        isManager,
      };
    }),
});
