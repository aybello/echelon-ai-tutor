import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { jwtVerify } from "jose";
import { ENV } from "./env";

// FIX 2 (P1): Fail-closed blank-key guard.
// If JWT_SECRET is blank, jwtVerify would accept any token signed with an empty key.
// We guard against this by refusing to verify cookies when the secret is missing.
const DASHBOARD_JWT_SECRET = ENV.cookieSecret
  ? new TextEncoder().encode(ENV.cookieSecret)
  : null;
const DASHBOARD_COOKIE = "echelon_dashboard_session";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  /** Email verified from the echelon_dashboard_session httpOnly cookie.
   *  Set when a student has completed OTP login. Never trusts client input. */
  studentEmail: string | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  let studentEmail: string | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  // Verify the student OTP session cookie independently of Manus OAuth.
  // Uses the same jose/cookieSecret that dashboardAuthRouter uses.
  // FIX 2: Skip verification entirely when DASHBOARD_JWT_SECRET is null (blank JWT_SECRET).
  // This ensures a missing secret fails closed rather than accepting forged cookies.
  if (DASHBOARD_JWT_SECRET) {
    try {
      const token = (opts.req as any).cookies?.[DASHBOARD_COOKIE];
      if (token) {
        const { payload } = await jwtVerify(token, DASHBOARD_JWT_SECRET);
        if (payload.type === "dashboard" && typeof payload.email === "string" && payload.email) {
          studentEmail = payload.email.trim().toLowerCase();
        }
      }
    } catch {
      // Invalid or expired cookie — studentEmail stays null.
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    studentEmail,
  };
}
