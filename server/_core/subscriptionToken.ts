/**
 * subscriptionToken.ts
 *
 * Issues and verifies short-lived JWT access tokens for subscription customers
 * who are not logged in (email-only access via Restore Access or post-checkout).
 *
 * WHY THIS EXISTS:
 * The original system stored access in localStorage only. If a customer cleared
 * their browser, switched devices, or used incognito, they lost access silently.
 * This token is stored in localStorage alongside the exam types, but it is
 * cryptographically signed by the server — so the server can verify it
 * independently without a DB lookup on every question fetch.
 *
 * TOKEN PAYLOAD:
 *   email      — the subscriber's email address
 *   examTypes  — array of exam type strings this token grants access to
 *   iat        — issued at (Unix seconds)
 *   exp        — expires at (Unix seconds, default 1 year)
 *
 * SECURITY NOTES:
 * - Signed with JWT_SECRET (HS256). Anyone with the token can read questions
 *   for the covered exam types — this is intentional (same as localStorage).
 * - The token does NOT grant admin access or mutation rights.
 * - If a subscription is cancelled, old tokens remain valid until expiry.
 *   For now this is acceptable (annual subscriptions). If needed, add a
 *   token revocation list in the DB.
 */

import { SignJWT, jwtVerify } from "jose";
import { ENV } from "./env";

const TOKEN_ISSUER = "echelon-access";
const TOKEN_AUDIENCE = "echelon-quiz";
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

function getSecret(): Uint8Array {
  const secret = ENV.cookieSecret;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export interface SubscriptionTokenPayload {
  email: string;
  examTypes: string[];
}

/**
 * Issue a signed access token for a subscription customer.
 * Call this from the server after verifying their subscription in the DB.
 */
export async function issueSubscriptionToken(
  payload: SubscriptionTokenPayload,
  expiresInMs = ONE_YEAR_MS
): Promise<string> {
  const secret = getSecret();
  const expirationSeconds = Math.floor((Date.now() + expiresInMs) / 1000);

  return new SignJWT({
    email: payload.email,
    examTypes: payload.examTypes,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer(TOKEN_ISSUER)
    .setAudience(TOKEN_AUDIENCE)
    .setExpirationTime(expirationSeconds)
    .sign(secret);
}

/**
 * Verify a subscription access token.
 * Returns the payload if valid, null if invalid or expired.
 */
export async function verifySubscriptionToken(
  token: string | undefined | null
): Promise<SubscriptionTokenPayload | null> {
  if (!token) return null;
  try {
    const secret = getSecret();
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
    });
    const { email, examTypes } = payload as Record<string, unknown>;
    if (
      typeof email !== "string" ||
      !email ||
      !Array.isArray(examTypes) ||
      examTypes.some((t) => typeof t !== "string")
    ) {
      return null;
    }
    return { email, examTypes: examTypes as string[] };
  } catch {
    return null;
  }
}
