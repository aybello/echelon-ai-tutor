import { sql } from "drizzle-orm";
import { questionBankMeta, questions } from "../drizzle/schema";

/**
 * Existing banks are explicitly grandfathered while their historical content
 * is reviewed. New banks default to `approved_only`, so draft/in-review items
 * cannot leak into any learner surface.
 */
export function learnerVisibleQuestionFilter() {
  return sql<boolean>`EXISTS (
    SELECT 1
    FROM ${questionBankMeta}
    WHERE ${questionBankMeta.bankKey} = ${questions.bankKey}
      AND (
        (${questionBankMeta.publicationPolicy} = 'legacy_non_rejected' AND ${questions.reviewStatus} <> 'rejected')
        OR
        (${questionBankMeta.publicationPolicy} = 'approved_only' AND ${questions.reviewStatus} = 'approved')
      )
  )`;
}
