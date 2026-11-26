import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { readVerifiedEmailFromRequest } from "./emailSession";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  /** Email verified from the echelon_dashboard_session httpOnly cookie.
   *  Set when a student has completed OTP login or paid via Stripe.
   *  Never trusts client-provided input. */
  studentEmail: string | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  let studentEmail: string | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch {
    user = null;
  }

  // Read the verified Echelon email session cookie.
  // Fails closed: returns null when JWT_SECRET is missing or cookie is invalid/expired.
  studentEmail = await readVerifiedEmailFromRequest(opts.req);

  return {
    req: opts.req,
    res: opts.res,
    user,
    studentEmail,
  };
}
