import { createHmac } from "node:crypto";
import type { Request, Response } from "express";
import { parse } from "cookie";
import { SignJWT, jwtVerify } from "jose";
import { ENV } from "./env";
import { getSessionCookieOptions } from "./cookies";

export const ANONYMOUS_TUTOR_COOKIE = "echelon_tutor_identity";
export const ANONYMOUS_TUTOR_TTL_SECONDS = 30 * 24 * 60 * 60;
const PURPOSE = "echelon-anonymous-tutor";
const MAX_INPUT = 8192;
const ID_PATTERN = /^tutor:[a-f0-9]{64}$/;

/** Not an authentication credential. No client-provided anonymous ID is trusted. */
export async function resolveAnonymousTutorIdentity(req: Request, res: Response): Promise<string> {
  // Never sign with an empty, development fallback, or known placeholder key.
  const secret = ENV.cookieSecret;
  if (!secret.trim() || /^(sandbox|placeholder|change.?me)$/i.test(secret)) {
    throw new Error("A configured JWT_SECRET is required for anonymous tutor identity");
  }
  const key = new TextEncoder().encode(secret);
  const now = Math.floor(Date.now() / 1000);
  const header = req.headers.cookie;
  const token: unknown = typeof header === "string"
    ? (header.length <= MAX_INPUT ? parse(header)[ANONYMOUS_TUTOR_COOKIE] : undefined)
    : req.cookies?.[ANONYMOUS_TUTOR_COOKIE];
  if (typeof token === "string" && token.length <= MAX_INPUT) {
    try {
      const { payload } = await jwtVerify(token, key, {
        algorithms: ["HS256"], issuer: PURPOSE, audience: PURPOSE,
        requiredClaims: ["iat", "exp", "sub"],
      });
      if (typeof payload.sub === "string" && ID_PATTERN.test(payload.sub)
        && Number.isSafeInteger(payload.iat) && Number.isSafeInteger(payload.exp)
        && payload.iat! <= now && payload.exp! > now
        && payload.exp! - payload.iat! === ANONYMOUS_TUTOR_TTL_SECONDS) {
        return payload.sub;
      }
    } catch {
      // Invalid, tampered, oversized or expired cookies have no authority.
    }
  }

  // Missing/blocked cookies retain the previous IP + UA fallback semantics.
  // HMAC hides raw network information and avoids issuing a fresh quota per call.
  // A valid cookie preserves this INITIAL seed across later IP/UA changes.
  const seed = JSON.stringify([
    String(req.ip ?? "unknown").slice(0, MAX_INPUT / 2),
    String(req.get("user-agent") ?? "unknown").slice(0, MAX_INPUT / 2),
  ]);
  const id = `tutor:${createHmac("sha256", key).update(`${PURPOSE}:seed:`).update(seed).digest("hex")}`;
  const signed = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer(PURPOSE).setAudience(PURPOSE).setSubject(id)
    .setIssuedAt(now).setExpirationTime(now + ANONYMOUS_TUTOR_TTL_SECONDS).sign(key);
  res.cookie(ANONYMOUS_TUTOR_COOKIE, signed, {
    ...getSessionCookieOptions(req),
    httpOnly: true, secure: true, sameSite: "lax", path: "/",
    maxAge: ANONYMOUS_TUTOR_TTL_SECONDS * 1000,
    expires: new Date((now + ANONYMOUS_TUTOR_TTL_SECONDS) * 1000),
  });
  // Use the issued identity immediately, including the first quota check/event.
  return id;
}
