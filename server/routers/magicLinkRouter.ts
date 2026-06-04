/**
 * Magic Link Authentication Router
 *
 * Provides passwordless email login for paying customers.
 * Flow:
 * 1. User enters email on /account page
 * 2. If they have purchases/subscriptions, a magic link is emailed
 * 3. User clicks link -> token is validated -> session is established
 */

import { z } from "zod";
import crypto from "crypto";
import { eq, and, gt, isNull } from "drizzle-orm";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { magicLinks, purchases, subscriptions } from "../../drizzle/schema";
import { sendMagicLinkEmail } from "../email";
import { issueSubscriptionToken } from "../_core/subscriptionToken";
import { getSubscriptionExamTypes } from "../stripe/subscriptionProducts";

const MAGIC_LINK_EXPIRY_MINUTES = 15;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export const magicLinkRouter = router({
  /**
   * Request a magic link email. Checks if the email has any purchases or active subscriptions.
   * If yes, generates a token and sends an email. Returns success regardless (to prevent email enumeration).
   */
  requestMagicLink: publicProcedure
    .input(z.object({
      email: z.string().email(),
      origin: z.string().url(), // frontend origin for building the magic link URL
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { sent: true }; // always return true to prevent enumeration

      const email = normalizeEmail(input.email);

      // Check if user has any purchases or active subscriptions
      const [purchaseRows, subRows] = await Promise.all([
        db.select({ productKey: purchases.productKey })
          .from(purchases)
          .where(eq(purchases.email, email))
          .limit(1),
        db.select({ tier: subscriptions.tier, province: subscriptions.province, status: subscriptions.status })
          .from(subscriptions)
          .where(eq(subscriptions.email, email))
          .limit(5),
      ]);

      const hasPurchases = purchaseRows.length > 0;
      const hasActiveSubs = subRows.some(s => s.status === "active" || s.status === "trialing");

      if (!hasPurchases && !hasActiveSubs) {
        // No purchases found, but still return true to prevent enumeration
        console.log(`[MagicLink] No purchases/subs found for ${email}`);
        return { sent: true };
      }

      // Build the exam types list from purchases + subscriptions
      const examTypesFromPurchases = purchaseRows.length > 0
        ? (await db.select({ productKey: purchases.productKey }).from(purchases).where(eq(purchases.email, email))).map(r => r.productKey)
        : [];

      const examTypesFromSubs = subRows
        .filter(s => s.status === "active" || s.status === "trialing")
        .flatMap(s => {
          try {
            return getSubscriptionExamTypes(s.tier as any, s.province as any);
          } catch {
            return [];
          }
        });

      const allExamTypes = Array.from(new Set([...examTypesFromPurchases, ...examTypesFromSubs]));

      // Generate a secure token
      const token = crypto.randomBytes(48).toString("base64url");
      const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRY_MINUTES * 60 * 1000);

      // Store the magic link
      await db.insert(magicLinks).values({
        email,
        token,
        examTypes: JSON.stringify(allExamTypes),
        expiresAt,
      });

      // Build the magic link URL
      const magicLinkUrl = `${input.origin}/auth/magic?token=${token}`;

      // Send the email (non-blocking)
      sendMagicLinkEmail({
        email,
        magicLinkUrl,
        expiresInMinutes: MAGIC_LINK_EXPIRY_MINUTES,
      }).catch(err => {
        console.error("[MagicLink] Failed to send email:", err.message);
      });

      console.log(`[MagicLink] Sent to ${email} with ${allExamTypes.length} exam types`);
      return { sent: true };
    }),

  /**
   * Consume a magic link token. Validates the token, marks it as used,
   * and returns an access token (JWT) + exam types for the client to store.
   */
  consumeMagicLink: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { valid: false, email: "", examTypes: [] as string[], accessToken: "" };

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
        return { valid: false, email: "", examTypes: [] as string[], accessToken: "" };
      }

      // Mark as used
      await db.update(magicLinks)
        .set({ usedAt: now })
        .where(eq(magicLinks.id, link.id));

      const examTypes: string[] = JSON.parse(link.examTypes);

      // Issue a JWT access token
      const accessToken = await issueSubscriptionToken({ email: link.email, examTypes });

      return {
        valid: true,
        email: link.email,
        examTypes,
        accessToken,
      };
    }),
});
