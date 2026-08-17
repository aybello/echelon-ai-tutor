import { router, adminProcedure, publicProcedure } from "../_core/trpc";
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
});
