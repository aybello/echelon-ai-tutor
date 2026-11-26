import { createHash } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { featureRequests } from "../../drizzle/schema";
import {
  featureRequestListInputSchema, featureRequestSetStatusInputSchema,
  featureRequestSubmitInputSchema,
} from "../../shared/featureRequests";
import { getDb } from "../db";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";
import type { TrpcContext } from "../_core/context";

// Existing Express limiters cannot enforce verified-identity limits on tRPC callers.
// Per-process, sliding-window protection; at most 5,000 identities and 3 timestamps each.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_IDENTITIES = 5000;
const submissions = new Map<string, number[]>();
export function resetFeatureRequestLimiterForTests() {
  if (process.env.NODE_ENV !== "test") throw new Error("Test-only reset");
  submissions.clear();
}
function consumeSubmission(ctx: TrpcContext, email: string | null) {
  const identity = email ? `email:${email}` : ctx.user ? `user:${ctx.user.id}`
    : `ip:${ctx.req.ip ?? ctx.req.socket?.remoteAddress ?? "unknown"}`;
  const key = createHash("sha256").update(identity).digest("hex");
  const now = Date.now();
  // Expired identities are evicted; live identities are never evicted to bypass limits.
  for (const [existingKey, times] of submissions) {
    const active = times.filter(time => time > now - WINDOW_MS);
    if (!active.length) submissions.delete(existingKey);
    else submissions.set(existingKey, active);
  }
  const times = submissions.get(key) ?? [];
  if (times.length >= 3 || (!submissions.has(key) && submissions.size >= MAX_IDENTITIES)) {
    throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Please wait before sending another suggestion." });
  }
  submissions.set(key, [...times, now]);
}
function verifiedEmail(ctx: TrpcContext): string | null {
  const value = ctx.studentEmail ?? ctx.user?.email;
  if (!value) return null;
  const parsed = z.string().trim().email().max(320).safeParse(value);
  return parsed.success ? parsed.data.toLowerCase() : null;
}
async function database() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  return db;
}

export const featureRequestsRouter = router({
  submit: publicProcedure.input(featureRequestSubmitInputSchema).mutation(async ({ ctx, input }) => {
    const email = verifiedEmail(ctx);
    if (input.followUpAllowed && !email) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "A verified email is required to allow follow-up." });
    }
    consumeSubmission(ctx, email);
    const db = await database();
    // OTP may belong to a different learner than a coexisting OAuth session.
    const userId = ctx.studentEmail != null && ctx.user?.email?.trim().toLowerCase() !== email
      ? null : ctx.user?.id ?? null;
    const [result] = await db.insert(featureRequests).values({
      userId, email,
      courseKey: input.courseKey, pagePath: input.pagePath, source: input.source,
      suggestion: input.suggestion, problem: input.problem || null,
      followUpAllowed: input.followUpAllowed, status: "new",
    });
    if (result?.affectedRows !== 1) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Suggestion could not be saved." });
    }
    // No notification or learner email is sent, even when follow-up is allowed.
    return { success: true as const };
  }),
  list: adminProcedure.input(featureRequestListInputSchema).query(async ({ input }) => {
    const db = await database();
    const rows = await db.select().from(featureRequests)
      .where(input.status ? eq(featureRequests.status, input.status) : undefined)
      .orderBy(desc(featureRequests.createdAt), desc(featureRequests.id))
      .limit(input.limit + 1).offset((input.page - 1) * input.limit);
    return {
      items: rows.slice(0, input.limit), page: input.page, limit: input.limit,
      hasMore: rows.length > input.limit,
    };
  }),
  setStatus: adminProcedure.input(featureRequestSetStatusInputSchema).mutation(async ({ input }) => {
    const db = await database();
    const [result] = await db.update(featureRequests).set({ status: input.status })
      .where(eq(featureRequests.id, input.id));
    if (!result || !Number.isInteger(result.affectedRows) || result.affectedRows < 0) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Status could not be saved." });
    }
    if (result.affectedRows === 0) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Feature request not found." });
    }
    return { success: true as const };
  }),
});
