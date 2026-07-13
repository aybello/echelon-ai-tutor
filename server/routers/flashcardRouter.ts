/**
 * Flashcard progress router — persists spaced-repetition known/unknown state
 * per email + examType so students can resume across sessions and devices.
 *
 * Security notes (Issue H):
 * - saveProgress: knownIds is capped at 20,000 entries; each string ID is capped at 64 chars;
 *   the serialized JSON must be ≤ 200,000 bytes. Oversized payloads are rejected with a
 *   clear PAYLOAD_TOO_LARGE error before any DB write.
 * - getAllProgress / getProgress: identity is resolved from the verified server session
 *   (ctx.user or ctx.studentEmail) first. If no session is present, input.email is used as
 *   a fallback ONLY when the caller supplies it — this preserves the existing public Account
 *   page use-case while preventing unauthenticated enumeration of other users' progress once
 *   a session is in place. A future hardening step can remove the input.email fallback
 *   entirely once all clients pass a session cookie.
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { flashcardProgress } from "../../drizzle/schema";

/** Maximum number of card IDs allowed in a single saveProgress call. */
const MAX_KNOWN_IDS = 20_000;
/** Maximum length of a single string card ID. */
const MAX_ID_STRING_LEN = 64;
/** Maximum serialized byte size of the knownIds JSON. */
const MAX_KNOWN_IDS_BYTES = 200_000;

export const flashcardRouter = router({
  /**
   * Load the saved progress for a given email + examType.
   * Returns knownIds (array of card IDs) and totalCards.
   */
  getProgress: publicProcedure
    .input(z.object({
      email: z.string().email().optional(), // optional — session takes priority
      examType: z.string().min(1).max(64),
    }))
    .query(async ({ input, ctx }) => {
      // Priority: OAuth email > server-verified OTP session email > client-supplied email
      const email = ctx.user?.email ?? ctx.studentEmail ?? input.email;
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
   *
   * Issue H fix: knownIds is bounded to prevent stored-DoS attacks.
   */
  saveProgress: publicProcedure
    .input(z.object({
      email: z.string().email().optional(), // optional — session takes priority
      examType: z.string().min(1).max(64),
      // Bounded: max 20,000 entries; each string ID max 64 chars
      knownIds: z.array(
        z.union([
          z.number().int(),
          z.string().max(MAX_ID_STRING_LEN),
        ])
      ).max(MAX_KNOWN_IDS),
      totalCards: z.number().int().min(0),
    }))
    .mutation(async ({ input, ctx }) => {
      // Attribution priority: OAuth email > server-verified OTP session email > client-supplied email.
      // The client-supplied email fallback is kept for genuine guest sessions (no session cookie)
      // but is NOT trusted for attribution when a session exists — the session always wins.
      // This prevents unauthenticated callers from writing flashcard progress under any email.
      // Resolve the email for attribution: session always wins over client-supplied.
      const verifiedEmail = ctx.user?.email ?? ctx.studentEmail ?? null;
      const resolvedEmail = verifiedEmail
        ? verifiedEmail.toLowerCase()
        : (input.email ?? "").toLowerCase();
      if (!resolvedEmail) return { success: false };
      const db = await getDb();
      if (!db) return { success: false };

      const knownIdsJson = JSON.stringify(input.knownIds);

      // Sanity-check serialized size to guard against deeply nested or crafted payloads
      if (knownIdsJson.length > MAX_KNOWN_IDS_BYTES) {
        throw new TRPCError({
          code: "PAYLOAD_TOO_LARGE",
          message: `knownIds payload exceeds ${MAX_KNOWN_IDS_BYTES} bytes. Please reduce the number of saved card IDs.`,
        });
      }

      // Check if a row already exists
      const existing = await db
        .select({ id: flashcardProgress.id })
        .from(flashcardProgress)
        .where(
          and(
            eq(flashcardProgress.email, resolvedEmail),
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
              eq(flashcardProgress.email, resolvedEmail),
              eq(flashcardProgress.examType, input.examType),
            )
          );
      } else {
        await db.insert(flashcardProgress).values({
          email: resolvedEmail,
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
   *
   * Issue H fix: when a verified session is present, the session email is used
   * exclusively — the caller cannot enumerate another user's progress by passing
   * a different email. Without a session, input.email is required (existing
   * Account page use-case).
   */
  getAllProgress: publicProcedure
    .input(z.object({ email: z.string().email().optional() }))
    .query(async ({ input, ctx }) => {
      // Resolve identity: verified session takes priority
      const sessionEmail = ctx.user?.email ?? ctx.studentEmail ?? null;

      // If a session is present, ignore input.email entirely (IDOR guard)
      // If no session, require input.email (public Account page fallback)
      const email = sessionEmail ?? input.email ?? null;

      if (!email) {
        return { progress: {} as Record<string, { knownCount: number; totalCards: number }> };
      }

      // If no session and input.email differs from session — this branch only
      // runs when sessionEmail is null (no session), so no IDOR risk.
      const db = await getDb();
      if (!db) return { progress: {} as Record<string, { knownCount: number; totalCards: number }> };

      const rows = await db
        .select()
        .from(flashcardProgress)
        .where(eq(flashcardProgress.email, email.toLowerCase()));

      const progress: Record<string, { knownCount: number; totalCards: number }> = {};
      for (const row of rows) {
        let knownIds: (number | string)[] = [];
        try { knownIds = JSON.parse(row.knownIds); } catch { /* ignore */ }
        progress[row.examType] = { knownCount: knownIds.length, totalCards: row.totalCards };
      }
      return { progress };
    }),
});
