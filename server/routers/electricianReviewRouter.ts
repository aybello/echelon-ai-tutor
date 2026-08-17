import { router, adminProcedure, publicProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { certificationBankVersions, certificationQuestions } from "../../drizzle/schema";
import { getDb } from "../db";
import electricianQuestions from "../private/electrician309aDraftQuestions";
import {
  ELECTRICIAN_309A_PROGRAM_KEY,
  selectCertificationQuestionsForInternalReview,
  selectCertificationQuestionsForPublicPreview,
} from "../../shared/certificationPrograms";

/**
 * Full draft material stays on the server. The limited public preview is a
 * policy-controlled demonstration, while commercial learner delivery remains
 * blocked until technical review and product approval are complete.
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
   * Free beta learner delivery intentionally reads only the active beta bank.
   * Imported draft material stays invisible until the release controls below are set.
   */
  get309ABetaPractice: publicProcedure.query(async () => {
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
        id: certificationQuestions.id,
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
    return { questions, total: questions.length };
  }),
});
