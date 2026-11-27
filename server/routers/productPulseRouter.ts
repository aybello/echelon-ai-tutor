import { createHash } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { productPulseResponses } from "../../drizzle/schema";
import { productPulseListInputSchema, productPulseSubmitInputSchema } from "../../shared/productPulse";
import { getDb } from "../db";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";
import type { TrpcContext } from "../_core/context";

const WINDOW_MS = 14 * 24 * 60 * 60 * 1000;
const MAX_IDENTITIES = 5000;
const submissions = new Map<string, number[]>();

export function resetProductPulseLimiterForTests() {
  if (process.env.NODE_ENV !== "test") throw new Error("Test-only reset");
  submissions.clear();
}

function verifiedEmail(ctx: TrpcContext): string | null {
  const value = ctx.studentEmail ?? ctx.user?.email;
  const parsed = z.string().trim().email().max(320).safeParse(value);
  return parsed.success ? parsed.data.toLowerCase() : null;
}

function consumeSubmission(ctx: TrpcContext, email: string | null) {
  const identity = email ? `email:${email}` : ctx.user ? `user:${ctx.user.id}` : `ip:${ctx.req.ip ?? "unknown"}`;
  const key = createHash("sha256").update(identity).digest("hex");
  const now = Date.now();
  for (const [existingKey, times] of submissions) {
    const active = times.filter(time => time > now - WINDOW_MS);
    if (active.length) submissions.set(existingKey, active);
    else submissions.delete(existingKey);
  }
  const times = submissions.get(key) ?? [];
  if (times.length >= 3 || (!submissions.has(key) && submissions.size >= MAX_IDENTITIES)) {
    throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Please wait before sending more feedback." });
  }
  submissions.set(key, [...times, now]);
}

async function database() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  return db;
}

export const productPulseRouter = router({
  submit: publicProcedure.input(productPulseSubmitInputSchema).mutation(async ({ ctx, input }) => {
    const email = verifiedEmail(ctx);
    consumeSubmission(ctx, email);
    const db = await database();
    const userId = ctx.studentEmail != null && ctx.user?.email?.trim().toLowerCase() !== email ? null : ctx.user?.id ?? null;
    const [result] = await db.insert(productPulseResponses).values({
      userId, email, courseKey: input.courseKey, pagePath: input.pagePath, source: input.source,
      response: input.response, comment: input.comment || null, context: "unknown",
    });
    if (result?.affectedRows !== 1) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Feedback could not be saved." });
    return { success: true as const };
  }),
  list: adminProcedure.input(productPulseListInputSchema).query(async ({ input }) => {
    const db = await database();
    return db.select().from(productPulseResponses)
      .where(input.response === "all" ? undefined : eq(productPulseResponses.response, input.response))
      .orderBy(desc(productPulseResponses.createdAt), desc(productPulseResponses.id))
      .limit(input.limit).offset((input.page - 1) * input.limit);
  }),
});
