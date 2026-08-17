import { router, adminProcedure } from "../_core/trpc";
import electricianQuestions from "../private/electrician309aDraftQuestions";
import {
  ELECTRICIAN_309A_PROGRAM_KEY,
  selectCertificationQuestionsForInternalReview,
} from "../../shared/certificationPrograms";

/**
 * Draft skilled-trades material is deliberately served only to authenticated
 * administrators. It must not be bundled into a public client route or treated
 * as learner-deliverable content before its technical review is complete.
 */
export const electricianReviewRouter = router({
  get309ADiagnostic: adminProcedure.query(() =>
    selectCertificationQuestionsForInternalReview(
      electricianQuestions,
      ELECTRICIAN_309A_PROGRAM_KEY,
    ),
  ),
});
