/**
 * emailSession.ts — Shared helper for the Echelon verified email session cookie.
 *
 * This is the single source of truth for issuing, reading, and clearing the
 * httpOnly cookie that identifies a verified Echelon user (OTP-verified student,
 * post-payment purchaser, or team-seat operator).
 *
 * The cookie name and JWT payload type are kept as-is for backward compatibility
 * with the existing dashboardAuthRouter. Do not rename in this sprint.
 *
 * Usage:
 *   issueVerifiedEmailSessionCookie(res, email)  — after OTP verify or payment
 *   clearVerifiedEmailSessionCookie(res)          — on logout
 *   readVerifiedEmailFromRequest(req)             — in context.ts
 */

import type { Response, Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import { ENV } from "./env";
import { normalizeEmail } from "./access";

export const ECHELON_SESSION_COOKIE = "echelon_dashboard_session";
const SESSION_TYPE = "dashboard"; // keep for backward compat — cookie payload unchanged
const DEFAULT_SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

function getSecret(): Uint8Array {
  if (!ENV.cookieSecret) {
    throw new Error("JWT_SECRET is not set — cannot issue verified email session");
  }
  return new TextEncoder().encode(ENV.cookieSecret);
}

/**
 * Issues a signed httpOnly session cookie for the given email.
 * Call this after OTP verification, one-time purchase, or subscription purchase.
 */
export async function issueVerifiedEmailSessionCookie(
  res: Response,
  email: string,
  maxAgeMs: number = DEFAULT_SESSION_MAX_AGE_MS,
): Promise<void> {
  const normalized = normalizeEmail(email);
  if (!normalized) throw new Error("Email required to issue session cookie");

  const token = await new SignJWT({ email: normalized, type: SESSION_TYPE })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor((Date.now() + maxAgeMs) / 1000))
    .sign(getSecret());

  res.cookie(ECHELON_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: ENV.isProduction,
    sameSite: "lax",
    maxAge: maxAgeMs,
    path: "/",
  });
}

/**
 * Clears the Echelon verified email session cookie.
 * Call this on logout.
 */
export function clearVerifiedEmailSessionCookie(res: Response): void {
  res.clearCookie(ECHELON_SESSION_COOKIE, { path: "/" });
}

/**
 * Reads and verifies the Echelon session cookie from an incoming request.
 * Returns the normalized email string, or null if absent/invalid/expired.
 * Fails closed: returns null when JWT_SECRET is missing.
 */
export async function readVerifiedEmailFromRequest(req: Request): Promise<string | null> {
  if (!ENV.cookieSecret) return null;

  try {
    const token = (req as any).cookies?.[ECHELON_SESSION_COOKIE];
    if (!token) return null;

    const { payload } = await jwtVerify(token, getSecret());
    if (payload.type !== SESSION_TYPE || typeof payload.email !== "string") return null;

    const email = normalizeEmail(payload.email);
    return email || null;
  } catch {
    return null;
  }
}
