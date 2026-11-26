import { createHash } from "node:crypto";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, eq, sql } from "drizzle-orm";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  flashcardProgress,
  flashcardProgressState,
  flashcardProgressOperations,
} from "../../drizzle/schema";

const idSchema = z
  .union([z.number().int(), z.string().min(1).max(64)])
  .transform(String);
const courseInput = z.object({
  examType: z.string().min(1).max(64),
  cacheScope: z.string().max(320).optional(),
});
const updateInput = courseInput.extend({
  operationId: z.string().uuid(),
  changes: z
    .array(z.object({ id: idSchema, known: z.boolean() }))
    .min(1)
    .max(1000),
  totalCards: z.number().int().min(0).max(20000),
});
function parseIds(raw: string): string[] {
  const value = JSON.parse(raw);
  return z.array(idSchema).max(20000).parse(value);
}
function identity(ctx: {
  user?: { email: string | null } | null;
  studentEmail?: string | null;
}) {
  const email = (ctx.user?.email ?? ctx.studentEmail)?.trim().toLowerCase();
  if (!email)
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Sign in to save flashcards.",
    });
  return email;
}
async function database() {
  const db = await getDb();
  if (!db)
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Progress could not be saved. Please retry.",
    });
  return db;
}
export const flashcardRouter = router({
  getProgress: publicProcedure
    .input(courseInput)
    .query(async ({ input, ctx }) => {
      const email = identity(ctx),
        db = await database();
      const [state] = await db
        .select()
        .from(flashcardProgressState)
        .where(
          and(
            eq(flashcardProgressState.email, email),
            eq(flashcardProgressState.examType, input.examType)
          )
        )
        .limit(1);
      if (state)
        return {
          knownIds: parseIds(state.knownIds),
          totalCards: state.totalCards,
        };
      const legacy = await db
        .select()
        .from(flashcardProgress)
        .where(
          and(
            eq(flashcardProgress.email, email),
            eq(flashcardProgress.examType, input.examType)
          )
        );
      return {
        knownIds: [...new Set(legacy.flatMap(r => parseIds(r.knownIds)))],
        totalCards: Math.max(0, ...legacy.map(r => r.totalCards)),
      };
    }),
  // Old replacement snapshots cannot safely express changes from a sampled deck.
  saveProgress: publicProcedure.input(z.unknown()).mutation(() => {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message:
        "Refresh this page to use reliable flashcard saving. Your old progress has been preserved.",
    });
  }),
  updateProgress: publicProcedure
    .input(updateInput)
    .mutation(async ({ input, ctx }) => {
      const email = identity(ctx),
        db = await database();
      const payloadHash = createHash("sha256")
        .update(
          JSON.stringify({
            examType: input.examType,
            changes: input.changes,
            totalCards: input.totalCards,
          })
        )
        .digest("hex");
      return db.transaction(async tx => {
        // The unique course row is also our transaction lock. Concurrent first saves
        // merge legacy progress exactly once, without altering legacy audit history.
        const legacy = await tx
          .select()
          .from(flashcardProgress)
          .where(
            and(
              eq(flashcardProgress.email, email),
              eq(flashcardProgress.examType, input.examType)
            )
          );
        const initial = [...new Set(legacy.flatMap(r => parseIds(r.knownIds)))];
        await tx
          .insert(flashcardProgressState)
          .values({
            email,
            examType: input.examType,
            knownIds: JSON.stringify(initial),
            totalCards: Math.max(
              input.totalCards,
              ...legacy.map(r => r.totalCards)
            ),
          })
          .onDuplicateKeyUpdate({
            set: { id: sql`${flashcardProgressState.id}` },
          });
        const [state] = await tx
          .select()
          .from(flashcardProgressState)
          .where(
            and(
              eq(flashcardProgressState.email, email),
              eq(flashcardProgressState.examType, input.examType)
            )
          )
          .for("update");
        const [receipt] = await tx
          .select()
          .from(flashcardProgressOperations)
          .where(eq(flashcardProgressOperations.operationId, input.operationId))
          .limit(1)
          .for("update");
        if (receipt) {
          if (
            receipt.email !== email ||
            receipt.examType !== input.examType ||
            receipt.payloadHash !== payloadHash
          )
            throw new TRPCError({
              code: "CONFLICT",
              message: "Save identity does not match this change.",
            });
          return {
            success: true,
            knownIds: parseIds(state.knownIds),
            totalCards: state.totalCards,
          };
        }
        const known = new Set(parseIds(state.knownIds));
        for (const change of input.changes)
          change.known ? known.add(change.id) : known.delete(change.id);
        const knownIds = [...known],
          raw = JSON.stringify(knownIds);
        if (known.size > 20000 || Buffer.byteLength(raw) > 200000)
          throw new TRPCError({
            code: "PAYLOAD_TOO_LARGE",
            message: "Flashcard progress exceeds the supported size.",
          });
        const totalCards = Math.max(
          state.totalCards,
          input.totalCards,
          known.size
        );
        await tx
          .insert(flashcardProgressOperations)
          .values({
            operationId: input.operationId,
            email,
            examType: input.examType,
            payloadHash,
          });
        await tx
          .update(flashcardProgressState)
          .set({ knownIds: raw, totalCards })
          .where(eq(flashcardProgressState.id, state.id));
        return { success: true, knownIds, totalCards };
      });
    }),
  getAllProgress: publicProcedure.query(async ({ ctx }) => {
    const email = (ctx.user?.email ?? ctx.studentEmail)?.trim().toLowerCase();
    const progress: Record<string, { knownCount: number; totalCards: number }> =
      {};
    if (!email) return { progress };
    const db = await database();
    const legacy = await db
      .select()
      .from(flashcardProgress)
      .where(eq(flashcardProgress.email, email));
    const grouped = new Map<string, Set<string>>();
    for (const row of legacy) {
      const ids = grouped.get(row.examType) ?? new Set<string>();
      parseIds(row.knownIds).forEach(id => ids.add(id));
      grouped.set(row.examType, ids);
      progress[row.examType] = {
        knownCount: ids.size,
        totalCards: Math.max(
          row.totalCards,
          progress[row.examType]?.totalCards ?? 0
        ),
      };
    }
    for (const row of await db
      .select()
      .from(flashcardProgressState)
      .where(eq(flashcardProgressState.email, email)))
      progress[row.examType] = {
        knownCount: parseIds(row.knownIds).length,
        totalCards: row.totalCards,
      };
    return { progress };
  }),
});
