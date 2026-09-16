import { createHash } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { ENV } from "./_core/env";
import type { TrpcContext } from "./_core/context";
import { normalizeEmail } from "./_core/access";
import { verifySubscriptionToken } from "./_core/subscriptionToken";

/** Resolve identity consistently for delivery and submission. A browser token
 * cannot replace an already verified account. Entitlement is checked separately.
 */
export async function practiceIdentity(ctx: TrpcContext, accessToken?: string) {
  let email = ctx.user ? normalizeEmail(ctx.user.email) : normalizeEmail(ctx.studentEmail);
  if (!ctx.user && !email && accessToken) email = normalizeEmail((await verifySubscriptionToken(accessToken))?.email);
  const key = ctx.user ? `user:${ctx.user.id}` : email ? `email:${email}` : "guest";
  return {
    owner: createHash("sha256").update(key).digest("hex"),
    context: !ctx.user && email ? { ...ctx, studentEmail: email } : ctx,
  };
}

function secret() {
  if (!ENV.cookieSecret) throw new Error("Practice receipt signing unavailable");
  return new TextEncoder().encode(ENV.cookieSecret);
}

export async function issuePracticeReceipt(bankKey: string, ids: number[], owner: string, preview: boolean) {
  return new SignJWT({ bankKey, ids, owner, preview })
    .setProtectedHeader({ alg: "HS256" }).setAudience("echelon-practice")
    .setIssuedAt().setExpirationTime("2h").sign(secret());
}

export async function attachPracticeReceipts<T extends { id: number }>(rows: T[], bankKey: string, owner: string, preview: boolean) {
  const result: Array<T & { attemptToken: string }> = [];
  for (let i = 0; i < rows.length; i += 50) {
    const chunk = rows.slice(i, i + 50);
    const attemptToken = await issuePracticeReceipt(bankKey, chunk.map(q => q.id), owner, preview);
    result.push(...chunk.map(q => ({ ...q, attemptToken })));
  }
  return result;
}

export async function permitsPracticeAttempt(token: string | undefined, bankKey: string, questionId: number, owner: string, hasAccess: boolean): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"], audience: "echelon-practice" });
    return payload.bankKey === bankKey && payload.owner === owner &&
      Array.isArray(payload.ids) && payload.ids.includes(questionId) &&
      typeof payload.preview === "boolean" && (payload.preview || hasAccess);
  } catch { return false; }
}
