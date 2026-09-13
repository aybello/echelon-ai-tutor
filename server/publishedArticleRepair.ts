import { createHash } from "node:crypto";
import { ontarioMathGuide } from "./content/ontarioMathGuide.mjs";

// Exact legacy seed only. Future editorial changes must not be overwritten.
const LEGACY_MATH_CONTENT_SHA256 = "dce94a59db22fe7f24694833c6c6efcd49f3fc2cdf271208c133fc6e1772c0ce";
/** Read-time correction of approved legacy content; publication/access decisions stay with the caller. */
export function repairPublishedArticle<T extends { slug: string; content: string; published?: number }>(post: T): T {
  if (post.slug !== ontarioMathGuide.slug || post.published === 0) return post;
  const digest = createHash("sha256").update(post.content.trim().replace(/\r\n/g, "\n")).digest("hex");
  if (digest !== LEGACY_MATH_CONTENT_SHA256) return post;
  const { title, excerpt, content, metaTitle, metaDescription, readingTimeMinutes } = ontarioMathGuide;
  return { ...post, title, excerpt, content, metaTitle, metaDescription, readingTimeMinutes };
}
