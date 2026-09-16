import { and, count, inArray } from "drizzle-orm";
import { questions } from "../drizzle/schema";
import { getCourseByKey } from "../shared/courseRegistry";
import type { EchelonProduct } from "../shared/products";
import { learnerVisibleQuestionFilter } from "./questionGovernance";

/**
 * A deliberate commercial release boundary for the clean-database relaunch.
 * Adding a product here is a reviewed launch decision, not an automatic side
 * effect of content staging. The matching bank must also meet the minimum
 * live inventory requirement below before checkout can be created.
 */
export const COMMERCIAL_RELEASE_PRODUCT_KEYS = ["oit", "oit-ww"] as const;
const COMMERCIAL_RELEASE_PRODUCT_KEY_SET = new Set<string>(COMMERCIAL_RELEASE_PRODUCT_KEYS);
export const MINIMUM_LIVE_QUESTION_COUNT = 100;

/**
 * Organization plans promise multi-course access. They remain deliberately
 * unavailable until the clean database has a reviewed organization offering
 * backed by the required complete course banks.
 */
export const ORGANIZATION_COMMERCE_ENABLED = false;
export const ORGANIZATION_COMMERCE_HOLD_MESSAGE =
  "Team checkout is temporarily unavailable while we complete the verified course-library relaunch. Please join the team launch list or contact support.";

export type CommercialAvailability = {
  key: string;
  questionCount: number;
};

type ProductWithKey = Pick<EchelonProduct, "key">;

export function selectCommercialAvailability(
  products: readonly ProductWithKey[],
  questionCountsByBank: ReadonlyMap<string, number>,
): CommercialAvailability[] {
  return products.flatMap((product) => {
    if (!COMMERCIAL_RELEASE_PRODUCT_KEY_SET.has(product.key)) return [];
    const course = getCourseByKey(product.key);
    if (!course || !course.isActive) return [];

    const questionCount = Number(questionCountsByBank.get(course.questionBankKey) ?? 0);
    if (!Number.isSafeInteger(questionCount) || questionCount < MINIMUM_LIVE_QUESTION_COUNT) return [];

    return [{ key: product.key, questionCount }];
  });
}

export async function getCommercialAvailability(
  db: {
    select: (...args: any[]) => any;
  },
  products: readonly ProductWithKey[],
): Promise<CommercialAvailability[]> {
  const candidateCourses = COMMERCIAL_RELEASE_PRODUCT_KEYS
    .map((productKey) => getCourseByKey(productKey))
    .filter((course): course is NonNullable<typeof course> => Boolean(course?.isActive));
  const bankKeys = candidateCourses.map((course) => course.questionBankKey);
  if (bankKeys.length === 0) return [];

  const rows = await db
    .select({ bankKey: questions.bankKey, questionCount: count() })
    .from(questions)
    .where(and(inArray(questions.bankKey, bankKeys), learnerVisibleQuestionFilter()))
    .groupBy(questions.bankKey);

  const questionCountsByBank = new Map<string, number>(
    (rows as Array<{ bankKey: string; questionCount: number | string }>).map((row) => [
      row.bankKey,
      Number(row.questionCount),
    ]),
  );
  return selectCommercialAvailability(products, questionCountsByBank);
}
