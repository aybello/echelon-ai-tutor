/**
 * Flashcard progress router — persists spaced-repetition known/unknown state
 * per email + examType so students can resume across sessions and devices.
 */
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { flashcardProgress } from "../../drizzle/schema";

export const flashcardRouter = router({
  /**
   * Load the saved progress for a given email + examType.
   * Returns knownIds (array of card IDs) and totalCards.
   */
  getProgress: publicProcedure
    .input(z.object({
      email: z.string().email(),
      examType: z.string().min(1).max(64),
    }))
    .query(async ({ input, ctx }) => {
      // Allow logged-in users to omit email — use their account email
      const email = ctx.user?.email ?? input.email;
      if (!email) return { knownIds: [] as (number | string)[], totalCards: 0 };
      const db = await getDb();
      if (!db) return { knownIds: [] as (number | string)[], totalCards: 0 };
      const rows = await db
        .select()
        .from(flashcardProgress)
        .where(
          and(
            eq(flashcardProgress.email, email.toLowerCase()),
            eq(flashcardProgress.examType, input.examType),
          )
        )
        .limit(1);
      if (rows.length === 0) return { knownIds: [] as (number | string)[], totalCards: 0 };
      const row = rows[0];
      let knownIds: (number | string)[] = [];
      try { knownIds = JSON.parse(row.knownIds); } catch { /* ignore */ }
      return { knownIds, totalCards: row.totalCards };
    }),

  /**
   * Save (upsert) the known card IDs for a given email + examType.
   */
  saveProgress: publicProcedure
    .input(z.object({
      email: z.string().email(),
      examType: z.string().min(1).max(64),
      knownIds: z.array(z.union([z.number(), z.string()])),
      totalCards: z.number().int().min(0),
    }))
    .mutation(async ({ input, ctx }) => {
      const email = (ctx.user?.email ?? input.email).toLowerCase();
      if (!email) return { success: false };
      const db = await getDb();
      if (!db) return { success: false };

      const knownIdsJson = JSON.stringify(input.knownIds);

      // Check if a row already exists
      const existing = await db
        .select({ id: flashcardProgress.id })
        .from(flashcardProgress)
        .where(
          and(
            eq(flashcardProgress.email, email),
            eq(flashcardProgress.examType, input.examType),
          )
        )
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(flashcardProgress)
          .set({ knownIds: knownIdsJson, totalCards: input.totalCards })
          .where(
            and(
              eq(flashcardProgress.email, email),
              eq(flashcardProgress.examType, input.examType),
            )
          );
      } else {
        await db.insert(flashcardProgress).values({
          email,
          examType: input.examType,
          knownIds: knownIdsJson,
          totalCards: input.totalCards,
        });
      }
      return { success: true };
    }),

  /**
   * Get all flashcard progress rows for a given email (used on Account page).
   * Returns a map of examType → { knownCount, totalCards }.
   */
  getAllProgress: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ input, ctx }) => {
      const email = (ctx.user?.email ?? input.email).toLowerCase();
      if (!email) return { progress: {} as Record<string, { knownCount: number; totalCards: number }> };
      const db = await getDb();
      if (!db) return { progress: {} as Record<string, { knownCount: number; totalCards: number }> };

      const rows = await db
        .select()
        .from(flashcardProgress)
        .where(eq(flashcardProgress.email, email));

      const progress: Record<string, { knownCount: number; totalCards: number }> = {};
      for (const row of rows) {
        let knownIds: (number | string)[] = [];
        try { knownIds = JSON.parse(row.knownIds); } catch { /* ignore */ }
        progress[row.examType] = { knownCount: knownIds.length, totalCards: row.totalCards };
      }
      return { progress };
    }),
});
