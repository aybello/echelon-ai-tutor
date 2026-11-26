import { createHash } from "node:crypto";
import { ontarioMathGuide } from "./content/ontarioMathGuide.mjs";

// Exact legacy seed only. Future editorial changes must not be overwritten.
const LEGACY_MATH_CONTENT_SHA256 = "dce94a59db22fe7f24694833c6c6efcd49f3fc2cdf271208c133fc6e1772c0ce";
// Independently recognize every replaced summary field. A later edit to one field
// must survive even when the old body or other old metadata remain unchanged.
const legacySummary = {
  title: "Ontario Water Operator Exam: Essential Math Formulas and Practice Problems",
  excerpt: "Math questions account for 20% of every Ontario water operator exam. This guide covers the 15 essential formulas you must memorize, with worked examples for the most common calculation types.",
  metaTitle: "Ontario Water Operator Exam Math Formulas | Echelon Institute",
  metaDescription: "Master the math for Ontario water operator exams. Covers 15 essential formulas with worked examples: chlorine dosage, flow rates, tank volumes, pump efficiency, and chemical feed calculations.",
  readingTimeMinutes: 10,
};
type PublicArticle = { slug: string; content?: string; published?: number; title?: string; excerpt?: string; metaTitle?: string | null; metaDescription?: string | null; readingTimeMinutes?: number };
/** Read-time correction only. The caller still controls publication and visibility. */
export function repairPublishedArticle<T extends PublicArticle>(post: T): T {
  if (post.slug !== ontarioMathGuide.slug || post.published === 0) return post;
  let repaired = post;
  for (const key of Object.keys(legacySummary) as (keyof typeof legacySummary)[]) {
    if (post[key] === legacySummary[key] && post[key] !== ontarioMathGuide[key]) {
      repaired = { ...repaired, [key]: ontarioMathGuide[key] };
    }
  }
  if (post.content !== undefined) {
    const digest = createHash("sha256").update(post.content.trim().replace(/\r\n/g, "\n")).digest("hex");
    if (digest === LEGACY_MATH_CONTENT_SHA256) repaired = { ...repaired, content: ontarioMathGuide.content };
  }
  return repaired;
}
