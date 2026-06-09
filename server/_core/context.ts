import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { jwtVerify } from "jose";
import { ENV } from "./env";

const DASHBOARD_JWT_SECRET = new TextEncoder().encode(ENV.cookieSecret);
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

  return {
    req: opts.req,
    res: opts.res,
    user,
    studentEmail,
  };
}
