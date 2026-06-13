/**
 * dashboardAuthRouter — email OTP login for the student dashboard.
 *
 * Flow:
 *   1. sendOtp: client sends email -> server checks it exists in purchases/subscriptions
 *              -> generates 6-digit code -> stores SHA-256 hash -> sends email
 *   2. verifyOtp: client sends email + code -> server verifies hash + expiry + attempts
 *               -> issues a signed JWT in an httpOnly cookie (dashboard_session)
 *   3. me: returns the email from the current dashboard session cookie (or null)
 *   4. logout: clears the dashboard_session cookie
 */

import { createHash, randomInt } from "crypto";
import { z } from "zod";
import { eq, and, gt, lt } from "drizzle-orm";
import { SignJWT, jwtVerify } from "jose";
import nodemailer from "nodemailer";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { dashboardOtps, purchases, subscriptions } from "../../drizzle/schema";
import { normalizeEmail } from "../_core/access";
import { ENV } from "../_core/env";
import { issueSubscriptionToken } from "../_core/subscriptionToken";
import { getAllUnlockedExamTypes } from "../stripe/products";
import { getAllSubscriptionExamTypes, type SubscriptionTier, type SubscriptionProvince } from "../stripe/subscriptionProducts";

const JWT_SECRET = new TextEncoder().encode(ENV.cookieSecret);
const COOKIE_NAME = "echelon_dashboard_session";
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;

function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

function createTransporter() {
  if (ENV.smtpHost && ENV.smtpUser && ENV.smtpPass) {
    return nodemailer.createTransport({
      host: ENV.smtpHost,
      port: Number(ENV.smtpPort ?? 587),
      secure: Number(ENV.smtpPort ?? 587) === 465,
      auth: { user: ENV.smtpUser, pass: ENV.smtpPass },
    });
  }
  throw new Error("SMTP not configured");
}

async function sendOtpEmail(email: string, code: string): Promise<void> {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"Echelon Institute" <${ENV.smtpUser}>`,
    to: email,
    subject: `Your Echelon dashboard code: ${code}`,
    html: `
      <div style="font-family:'Sora',Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0F172A;border-radius:12px;color:#F1F5F9">
        <div style="font-size:32px;margin-bottom:8px">📊</div>
        <h1 style="font-size:22px;font-weight:800;margin:0 0 8px">Your dashboard login code</h1>
        <p style="color:#94A3B8;font-size:14px;margin:0 0 24px">Enter this code to access your Echelon progress dashboard. It expires in 10 minutes.</p>
        <div style="background:#1E293B;border-radius:10px;padding:20px 24px;text-align:center;margin-bottom:24px">
          <span style="font-size:40px;font-weight:900;letter-spacing:10px;color:#38BDF8">${code}</span>
        </div>
        <p style="color:#64748B;font-size:12px;margin:0">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
    text: `Your Echelon dashboard login code is: ${code}\n\nThis code expires in 10 minutes.`,
  });
}

export const dashboardAuthRouter = router({
  /**
   * sendOtp — generates and emails a 6-digit code to the given address.
   * Succeeds if the email has at least one active purchase or active subscription.
   * Team managers are covered by the subscriptions check — grantSeat() creates a
   * subscription row for every manager tied to the org termEnd. If the org plan has
   * expired, the manager is blocked and must renew before regaining access.
   */
  sendOtp: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const email = normalizeEmail(input.email);
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Check 1: purchases table
      const purchaseRows = await db
        .select({ id: purchases.id })
        .from(purchases)
        .where(eq(purchases.email, email))
        .limit(1);

      let hasAccess = purchaseRows.length > 0;

      // Check 2: active subscriptions (includes org-managed seats)
      if (!hasAccess) {
        const now = new Date();
        const subRows = await db
          .select({ id: subscriptions.id })
          .from(subscriptions)
          .where(
            and(
              eq(subscriptions.email, email),
              eq(subscriptions.status, "active"),
              gt(subscriptions.currentPeriodEnd, now),
            ),
          )
          .limit(1);
        hasAccess = subRows.length > 0;
      }

      if (!hasAccess) {
        // Return success anyway to avoid email enumeration — just don't send
        return { sent: true };
      }

      // Generate 6-digit code
      const code = String(randomInt(100000, 999999));
      const codeHash = hashCode(code);
      const expiresAt = new Date(Date.now() + OTP_TTL_MS);

      // Invalidate any previous unused OTPs for this email
      await db
        .delete(dashboardOtps)
        .where(eq(dashboardOtps.email, email));

      await db.insert(dashboardOtps).values({
        email,
        codeHash,
        expiresAt,
        attempts: 0,
      });

      try {
        await sendOtpEmail(email, code);
      } catch (err) {
        console.error("[dashboardAuth.sendOtp] Email send failed:", err);
        // Still return success to avoid leaking info; code is in DB
      }

      return { sent: true };
    }),

  /**
   * verifyOtp — checks the code and issues a dashboard session cookie on success.
   */
  verifyOtp: publicProcedure
    .input(z.object({ email: z.string().email(), code: z.string().length(6) }))
    .mutation(async ({ input, ctx }) => {
      const email = normalizeEmail(input.email);
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const now = new Date();
      const rows = await db
        .select()
        .from(dashboardOtps)
        .where(
          and(
            eq(dashboardOtps.email, email),
            gt(dashboardOtps.expiresAt, now),
          ),
        )
        .limit(1);

      if (rows.length === 0) {
        throw new Error("Code expired or not found. Please request a new code.");
      }

      const otp = rows[0];

      if (otp.attempts >= MAX_ATTEMPTS) {
        throw new Error("Too many incorrect attempts. Please request a new code.");
      }

      if (otp.codeHash !== hashCode(input.code)) {
        // Increment attempt counter
        await db
          .update(dashboardOtps)
          .set({ attempts: otp.attempts + 1 })
          .where(eq(dashboardOtps.id, otp.id));
        const remaining = MAX_ATTEMPTS - otp.attempts - 1;
        throw new Error(`Incorrect code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`);
      }

      // Mark OTP as used
      await db
        .update(dashboardOtps)
        .set({ usedAt: now })
        .where(eq(dashboardOtps.id, otp.id));

      // Issue a signed JWT session (24 hours)
      const token = await new SignJWT({ email, type: "dashboard" })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("24h")
        .sign(JWT_SECRET);

      // Set httpOnly cookie
      const res = ctx.res;
      res.cookie(COOKIE_NAME, token, {
        httpOnly: true,
        secure: ENV.isProduction,
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000,
        path: "/",
      });

      // Look up all course access for this email and return it so the client
      // can store it in localStorage — giving full course access on sign-in
      const [purchaseRows, subRows] = await Promise.all([
        db.select({ productKey: purchases.productKey })
          .from(purchases)
          .where(eq(purchases.email, email)),
        db.select({ tier: subscriptions.tier, province: subscriptions.province })
          .from(subscriptions)
          .where(
            and(
              eq(subscriptions.email, email),
              eq(subscriptions.status, "active"),
              gt(subscriptions.currentPeriodEnd, now),
            )
          ),
      ]);

      const purchasedProductKeys = purchaseRows.map(r => r.productKey);
      const purchaseExamTypes = getAllUnlockedExamTypes(purchasedProductKeys);
      const subscriptionExamTypes = getAllSubscriptionExamTypes(
        subRows.map(r => ({ tier: r.tier as SubscriptionTier, province: r.province as SubscriptionProvince }))
      );
      const allExamTypes = Array.from(new Set([...purchaseExamTypes, ...subscriptionExamTypes]));

      const accessToken = allExamTypes.length > 0
        ? await issueSubscriptionToken({ email, examTypes: allExamTypes })
        : null;

      return { success: true, email, accessToken, unlockedExamTypes: allExamTypes, purchasedProductKeys };
    }),

  /**
   * me — returns the authenticated email from the dashboard session cookie, or null.
   */
  me: publicProcedure.query(async ({ ctx }) => {
    try {
      const req = ctx.req;
      const token = (req as any).cookies?.[COOKIE_NAME];
      if (!token) return { email: null };
      const { payload } = await jwtVerify(token, JWT_SECRET);
      if (payload.type !== "dashboard" || !payload.email) return { email: null };
      return { email: payload.email as string };
    } catch {
      return { email: null };
    }
  }),

  /**
   * logout — clears the dashboard session cookie.
   */
  logout: publicProcedure.mutation(async ({ ctx }) => {
      const res = ctx.res;
      res.clearCookie(COOKIE_NAME, { path: "/" });
    return { success: true };
  }),
});
