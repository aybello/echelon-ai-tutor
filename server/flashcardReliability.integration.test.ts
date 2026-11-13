import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq, inArray } from "drizzle-orm";
import { flashcardRouter } from "./routers/flashcardRouter";
import { getDb } from "./db";
import {
  flashcardProgress,
  flashcardProgressState,
  flashcardProgressOperations,
} from "../drizzle/schema";
const emails = [
  `cards-a-${crypto.randomUUID()}@echelon-test.invalid`,
  `cards-b-${crypto.randomUUID()}@echelon-test.invalid`,
];
const examType = "wpi-class4-wastewater";
const caller = (email: string | null) =>
  flashcardRouter.createCaller({
    user: null,
    studentEmail: email,
    req: { headers: {} },
    res: {},
  } as any);
let db: Awaited<ReturnType<typeof getDb>>;
describe.skipIf(!process.env.DATABASE_URL)(
  "flashcard database reliability",
  () => {
    beforeAll(async () => {
      db = await getDb();
      expect(db).toBeTruthy();
    });
    afterAll(async () => {
      if (!db) return;
      await db
        .delete(flashcardProgressOperations)
        .where(inArray(flashcardProgressOperations.email, emails));
      await db
        .delete(flashcardProgressState)
        .where(inArray(flashcardProgressState.email, emails));
      await db
        .delete(flashcardProgress)
        .where(inArray(flashcardProgress.email, emails));
    });
    it("preserves all legacy IDs across sampled decks and concurrent device changes", async () => {
      await db!.insert(flashcardProgress).values([
        {
          email: emails[0],
          examType,
          knownIds: JSON.stringify(
            Array.from({ length: 100 }, (_, i) => i + 1)
          ),
          totalCards: 907,
        },
        { email: emails[0], examType, knownIds: "[101]", totalCards: 907 },
      ]);
      expect(
        (await caller(emails[0]).getProgress({ examType })).knownIds
      ).toHaveLength(101);
      await Promise.all(
        [102, 103].map(id =>
          caller(emails[0]).updateProgress({
            examType,
            operationId: crypto.randomUUID(),
            changes: [{ id, known: true }],
            totalCards: 200,
          })
        )
      );
      const result = await caller(emails[0]).getProgress({ examType });
      expect(result.knownIds).toHaveLength(103);
      expect(result.totalCards).toBe(907);
      expect(
        await db!
          .select()
          .from(flashcardProgress)
          .where(eq(flashcardProgress.email, emails[0]))
      ).toHaveLength(2);
    });
    it("acknowledges a lost response without undoing a later rating", async () => {
      const operation = {
        examType,
        operationId: crypto.randomUUID(),
        changes: [{ id: "104", known: true }],
        totalCards: 200,
      };
      await Promise.all([
        caller(emails[0]).updateProgress(operation),
        caller(emails[0]).updateProgress(operation),
      ]);
      await caller(emails[0]).updateProgress({
        ...operation,
        operationId: crypto.randomUUID(),
        changes: [{ id: "104", known: false }],
      });
      expect(
        (await caller(emails[0]).updateProgress(operation)).knownIds
      ).not.toContain("104");
      expect(
        await db!
          .select()
          .from(flashcardProgressOperations)
          .where(
            eq(flashcardProgressOperations.operationId, operation.operationId)
          )
      ).toHaveLength(1);
      await expect(
        caller(emails[0]).updateProgress({
          ...operation,
          changes: [{ id: "105", known: true }],
        })
      ).rejects.toMatchObject({ code: "CONFLICT" });
      await expect(
        caller(emails[1]).updateProgress(operation)
      ).rejects.toMatchObject({ code: "CONFLICT" });
      expect(
        (await caller(emails[1]).getProgress({ examType })).knownIds
      ).toEqual([]);
    });
    it("isolates identities and rejects obsolete replacement saves", async () => {
      expect(
        (
          await caller(emails[1]).getProgress({
            examType,
            cacheScope: emails[0],
          })
        ).knownIds
      ).toEqual([]);
      await expect(
        caller(null).getProgress({ examType })
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
      await expect(
        caller(emails[0]).saveProgress({ examType, knownIds: [] })
      ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
      expect(
        (await caller(emails[0]).getProgress({ examType })).knownIds
      ).toHaveLength(103);
    });
  }
);
