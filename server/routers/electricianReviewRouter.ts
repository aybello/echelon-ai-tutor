import { practiceIdentity, attachPracticeReceipts } from "../practiceQuestionReceipt";
import { router, adminProcedure, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, count, eq } from "drizzle-orm";
import { certificationBankVersions, certificationQuestions } from "../../drizzle/schema";
import { getDb } from "../db";
import electricianQuestions from "../private/electrician309aDraftQuestions";
import {
  ELECTRICIAN_309A_PROGRAM_KEY,
  selectCertificationQuestionsForInternalReview,
  selectCertificationQuestionsForPublicPreview,
} from "../../shared/certificationPrograms";

/**
 * Full draft material stays on the server. The legacy preview remains limited,
 * while the standard shared course reads only the governed active learner bank.
 */
export const electricianReviewRouter = router({
  get309APublicPreview: publicProcedure.query(() =>
    selectCertificationQuestionsForPublicPreview(
      electricianQuestions,
      ELECTRICIAN_309A_PROGRAM_KEY,
    ),
  ),
  get309ADiagnostic: adminProcedure.query(() =>
    selectCertificationQuestionsForInternalReview(
      electricianQuestions,
      ELECTRICIAN_309A_PROGRAM_KEY,
    ),
  ),
  /**
   * Mock landing pages need only an accurate inventory count and the static
   * blueprint targets. They must not fetch answer-bearing practice records
   * before exam.startMock issues a signed active-exam projection.
   */
  get309ABetaMetadata: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database unavailable",
      });
    }

    const [bank] = await db
      .select({ id: certificationBankVersions.id })
      .from(certificationBankVersions)
      .where(and(
        eq(certificationBankVersions.programKey, ELECTRICIAN_309A_PROGRAM_KEY),
        eq(certificationBankVersions.bankKey, "electrician-309a"),
        eq(certificationBankVersions.releaseChannel, "beta"),
        eq(certificationBankVersions.active, true),
        eq(certificationBankVersions.commercialEligibility, false),
        eq(certificationBankVersions.teamEligibility, false),
      ))
      .limit(1);

    if (!bank) return { total: 0 };

    const [result] = await db
      .select({ total: count() })
      .from(certificationQuestions)
      .where(and(
        eq(certificationQuestions.bankVersionId, bank.id),
        eq(certificationQuestions.contentStatus, "beta_approved"),
        eq(certificationQuestions.publicEligibility, true),
      ));

    return { total: Number(result?.total ?? 0) };
  }),
  /**
   * Free beta learner delivery intentionally reads only the active beta bank.
   * Imported draft material stays invisible until the release controls below are set.
   */
  get309ABetaPractice: publicProcedure.input(z.object({ accessToken: z.string().max(8192).optional() }).optional()).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const [bank] = await db
      .select({ id: certificationBankVersions.id })
      .from(certificationBankVersions)
      .where(and(
        eq(certificationBankVersions.programKey, ELECTRICIAN_309A_PROGRAM_KEY),
        eq(certificationBankVersions.bankKey, "electrician-309a"),
        eq(certificationBankVersions.releaseChannel, "beta"),
        eq(certificationBankVersions.active, true),
        eq(certificationBankVersions.commercialEligibility, false),
        eq(certificationBankVersions.teamEligibility, false),
      ))
      .limit(1);

    if (!bank) return { questions: [], total: 0 };
    const rows = await db
      .select({
        id: certificationQuestions.bankItemNumber,
        module: certificationQuestions.module,
        taskCode: certificationQuestions.taskCode,
        topic: certificationQuestions.topic,
        difficulty: certificationQuestions.difficulty,
        question: certificationQuestions.question,
        options: certificationQuestions.options,
        correctIndex: certificationQuestions.correctIndex,
        explanation: certificationQuestions.explanation,
        steps: certificationQuestions.steps,
        tip: certificationQuestions.tip,
        isCalc: certificationQuestions.isCalc,
        diagramId: certificationQuestions.diagramId,
        diagramAlt: certificationQuestions.diagramAlt,
      })
      .from(certificationQuestions)
      .where(and(
        eq(certificationQuestions.bankVersionId, bank.id),
        eq(certificationQuestions.contentStatus, "beta_approved"),
        eq(certificationQuestions.publicEligibility, true),
      ))
      .orderBy(certificationQuestions.bankItemNumber);

    const questions = rows.flatMap((row) => {
      try {
        return [{
          ...row,
          options: JSON.parse(row.options) as string[],
          steps: row.steps ? JSON.parse(row.steps) as { l: string; c: string }[] : undefined,
          isCalc: row.isCalc === "yes",
        }];
      } catch {
        return [];
      }
    });
    const { owner } = await practiceIdentity(ctx, input?.accessToken);
    return { questions: await attachPracticeReceipts(questions, "electrician-309a", owner, false), total: questions.length };
  }),
});
