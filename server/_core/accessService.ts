/**
 * Echelon Institute — Access Service
 *
 * Central server-side access authority. All paid-content access decisions
 * MUST flow through this module. No route should make its own access decision
 * independently.
 *
 * Architecture:
 *   1. resolveVerifiedIdentity(ctx)
 *      → returns the verified identity (userId | email | null)
 *   2. getEntitlementsForIdentity(identity)
 *      → returns all unlocked exam types (delegates to resolveEntitlementsByEmail)
 *   3. hasAccessToExam(identity, examType)
 *      → boolean check for a single exam type
 *   4. assertAccess(ctx, examType)
 *      → throws TRPCError if no access (use in protected procedures)
 *   5. getAccessibleCoursesForIdentity(identity)
 *      → returns CourseEntry[] for all unlocked courses
 *   6. verifyAccessTokenAndRecheckDb(token, examType)
 *      → verifies a signed token AND re-checks DB entitlement
 *
 * Rules:
 * - The server decides access. localStorage is a convenience cache only.
 * - Signed tokens identify a session/email but do NOT prove entitlement alone.
 * - Stripe is billing truth. Database is access truth.
 * - Revoked, cancelled, refunded, disputed, or expired access MUST fail.
 * - Unknown exam types MUST fail closed.
 */

import { TRPCError } from "@trpc/server";
import type { TrpcContext } from "./context";
import {
  resolveEntitlementsByEmail,
  resolveAccess,
  resolveAccessByEmail,
  normalizeEmail,
  FREE_EXAM_TYPES,
  type ResolvedEntitlements,
} from "./access";
import { verifySubscriptionToken } from "./subscriptionToken";
import { getCourseByKey, getAllCourses } from "../../shared/courseRegistry";
import type { CourseEntry } from "../../shared/courseRegistry";

// ---------------------------------------------------------------------------
// Identity
// ---------------------------------------------------------------------------

export type VerifiedIdentity =
  | { type: "oauth"; userId: number; email: string }
  | { type: "otp"; email: string }
  | { type: "anonymous" };

/**
 * Resolve the verified identity from a tRPC context.
 *
 * Priority:
 * 1. OAuth session (ctx.user) — strongest, server-issued cookie
 * 2. OTP session (ctx.studentEmail) — server-verified email cookie
 * 3. Anonymous — no verified identity
 *
 * NOTE: Client-supplied email inputs are NOT a verified identity.
 * They may be used as a last-resort fallback for legacy restore-access
 * flows, but MUST NOT be used to prove entitlement alone.
 */
export function resolveVerifiedIdentity(ctx: TrpcContext): VerifiedIdentity {
  if (ctx.user) {
    return {
      type: "oauth",
      userId: ctx.user.id,
      email: normalizeEmail(ctx.user.email),
    };
  }
  if (ctx.studentEmail) {
    return { type: "otp", email: normalizeEmail(ctx.studentEmail) };
  }
  return { type: "anonymous" };
}

/**
 * Extract the email from a verified identity, or null for anonymous.
 */
export function identityEmail(identity: VerifiedIdentity): string | null {
  if (identity.type === "anonymous") return null;
  return identity.email;
}

// ---------------------------------------------------------------------------
// Entitlement resolution
// ---------------------------------------------------------------------------

/**
 * Resolve all entitlements for a verified identity.
 * Returns the full ResolvedEntitlements object.
 * Returns empty entitlements for anonymous identity.
 */
export async function getEntitlementsForIdentity(
  identity: VerifiedIdentity,
): Promise<ResolvedEntitlements> {
  const email = identityEmail(identity);
  return resolveEntitlementsByEmail(email);
}

/**
 * Check whether a verified identity has access to a specific exam type.
 *
 * For OAuth users, also checks owner/admin bypass.
 * For OTP users, checks DB entitlement by email.
 * For anonymous, returns false (unless the exam type is free).
 */
export async function hasAccessToExam(
  identity: VerifiedIdentity,
  examType: string,
): Promise<boolean> {
  // Free exam types are always accessible
  if (FREE_EXAM_TYPES.has(examType)) return true;

  if (identity.type === "oauth") {
    // resolveAccess handles owner/admin bypass
    const result = await resolveAccess(
      { id: identity.userId, email: identity.email } as Parameters<typeof resolveAccess>[0],
      examType,
    );
    return result.hasAccess;
  }

  if (identity.type === "otp") {
    const result = await resolveAccessByEmail(identity.email, examType);
    return result.hasAccess;
  }

  return false;
}

/**
 * Assert that the context has access to a given exam type.
 * Throws TRPCError FORBIDDEN if not.
 *
 * This is the primary guard for protected quiz/mock/flashcard procedures.
 * It checks all identity layers in priority order.
 *
 * @param ctx - tRPC context
 * @param examType - the exam type to check (e.g. "class1-water")
 * @param accessToken - optional signed subscription token from client localStorage
 * @param clientEmail - optional client-supplied email (legacy fallback only)
 */
export async function assertAccess(
  ctx: TrpcContext,
  examType: string,
  opts?: {
    accessToken?: string | null;
    clientEmail?: string | null;
  },
): Promise<void> {
  // Free exam types are always accessible
  if (FREE_EXAM_TYPES.has(examType)) return;

  const identity = resolveVerifiedIdentity(ctx);

  // 1. Check verified identity (OAuth or OTP)
  if (identity.type !== "anonymous") {
    const ok = await hasAccessToExam(identity, examType);
    if (ok) return;
  }

  // 2. Verify signed subscription token (no DB lookup — fast path)
  if (opts?.accessToken) {
    const tokenPayload = await verifySubscriptionToken(opts.accessToken);
    if (tokenPayload && tokenPayload.examTypes.includes(examType)) {
      return; // token is valid and covers this exam type
    }
  }

  // 3. Legacy client-email fallback (only when no session exists)
  // This is the weakest check — email alone does not prove identity.
  // It is kept for backward compatibility with restore-access flows
  // that have not yet been migrated to OTP sessions.
  if (
    identity.type === "anonymous" &&
    opts?.clientEmail &&
    !ctx.user &&
    !ctx.studentEmail
  ) {
    const result = await resolveAccessByEmail(opts.clientEmail, examType);
    if (result.hasAccess) return;
  }

  throw new TRPCError({
    code: "FORBIDDEN",
    message: `Access denied for exam type: ${examType}`,
  });
}

/**
 * Verify a signed subscription access token AND re-check DB entitlement.
 *
 * Unlike the fast-path token check in assertAccess, this performs a full
 * DB re-check to ensure the token has not been invalidated by cancellation,
 * refund, or revocation since it was issued.
 *
 * Use this for high-value operations (e.g. mock exam start, bulk question fetch).
 *
 * @returns { hasAccess: boolean; email: string | null }
 */
export async function verifyAccessTokenAndRecheckDb(
  token: string | null | undefined,
  examType: string,
): Promise<{ hasAccess: boolean; email: string | null }> {
  if (!token) return { hasAccess: false, email: null };

  // Step 1: verify the token signature and expiry
  const tokenPayload = await verifySubscriptionToken(token);
  if (!tokenPayload) return { hasAccess: false, email: null };

  // Step 2: token covers this exam type
  if (!tokenPayload.examTypes.includes(examType)) {
    return { hasAccess: false, email: tokenPayload.email };
  }

  // Step 3: re-check DB to confirm entitlement is still active
  const result = await resolveAccessByEmail(tokenPayload.email, examType);
  return { hasAccess: result.hasAccess, email: tokenPayload.email };
}

/**
 * Return all CourseEntry objects that a verified identity has access to.
 * Useful for building "your courses" lists on the dashboard/account page.
 */
export async function getAccessibleCoursesForIdentity(
  identity: VerifiedIdentity,
): Promise<CourseEntry[]> {
  const entitlements = await getEntitlementsForIdentity(identity);
  const unlockedTypes = new Set(entitlements.unlockedExamTypes);

  return getAllCourses()
    .filter((course) => unlockedTypes.has(course.courseKey))
    .filter((course) => course.isActive);
}

/**
 * Check whether a specific course key is accessible to a verified identity.
 * Resolves via the course's productKey (= examType for individual courses).
 */
export async function hasAccessToCourse(
  identity: VerifiedIdentity,
  courseKey: string,
): Promise<boolean> {
  const course = getCourseByKey(courseKey);
  if (!course) return false; // unknown course key — fail closed
  return hasAccessToExam(identity, course.courseKey);
}

// ---------------------------------------------------------------------------
// Re-exports for convenience
// ---------------------------------------------------------------------------

export {
  resolveEntitlementsByEmail,
  resolveAccess,
  resolveAccessByEmail,
  normalizeEmail,
  FREE_EXAM_TYPES,
} from "./access";
