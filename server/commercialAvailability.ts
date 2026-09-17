import { and, count, inArray } from "drizzle-orm";
import { questions } from "../drizzle/schema";
import { getCourseByKey } from "../shared/courseRegistry";
import type { EchelonProduct } from "../shared/products";
import { learnerVisibleQuestionFilter } from "./questionGovernance";

/** Courses that may be learner-visible but cannot enter individual checkout. */
export const NON_COMMERCIAL_PRODUCT_KEYS = [
  "electrician-309a",
] as const;
const NON_COMMERCIAL_PRODUCT_KEY_SET = new Set<string>(NON_COMMERCIAL_PRODUCT_KEYS);

/**
 * A deliberate commercial release boundary for the clean-database relaunch.
 * Adding a product here is a reviewed launch decision, not an automatic side
 * effect of content staging. The matching bank must also meet the minimum
 * live inventory requirement below before checkout can be created.
 */
export const COMMERCIAL_RELEASE_PRODUCT_KEYS = [
  "oit",
  "oit-ww",
  "class1-water",
  "class2-water",
  "class3-water",
  "class4-water",
  "class1-ww",
  "class2-ww",
  "class3-ww",
  "class4-ww",
  "wqa",
  "wpi-class1-water",
  "wpi-class2-water",
  "wpi-class3-water",
  "wpi-class4-water",
  "wpi-class1-wastewater",
  "wpi-class2-wastewater",
  "wpi-class3-wastewater",
  "wpi-class4-wastewater",
  "wpi-class1-water-coll",
  "wpi-class2-water-coll",
  "wpi-class3-water-coll",
  "wpi-class4-water-coll",
  "class1-water-dist",
  "class2-water-dist",
  "class3-water-dist",
  "class4-water-dist",
  "class1-wastewater-coll",
  "class2-wastewater-coll",
  "class3-wastewater-coll",
  "class4-wastewater-coll",
  "wpi-class1-water-dist",
  "wpi-class2-water-dist",
  "wpi-class3-water-dist",
  "wpi-class4-water-dist",
] as const;
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
    if (NON_COMMERCIAL_PRODUCT_KEY_SET.has(product.key)) return [];
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
