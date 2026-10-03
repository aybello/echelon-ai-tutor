import { desc, eq } from "drizzle-orm";
import { blogPosts } from "../drizzle/schema";
import { getDb } from "./db";
import { repairPublishedArticle } from "./publishedArticleRepair";
import { escapeHtml } from "./staticHead";

export const PUBLIC_BLOG_INDEX_LIMIT = 100;
export const PUBLIC_BLOG_INDEX_DEADLINE_MS = 1200;
export interface PublicBlogLink { slug: string; title: string; excerpt: string }

/** Only the anonymous published-content projection is read. No auth context or drafts. */
export async function loadPublicBlogLinks(): Promise<PublicBlogLink[]> {
  const db = await getDb();
  if (!db) throw new Error("Public blog index unavailable");
  const posts = await db.select({ slug: blogPosts.slug, title: blogPosts.title, excerpt: blogPosts.excerpt })
    .from(blogPosts).where(eq(blogPosts.published, 1))
    .orderBy(desc(blogPosts.publishedAt), desc(blogPosts.id)).limit(PUBLIC_BLOG_INDEX_LIMIT);
  return posts.map(repairPublishedArticle);
}

export async function boundedPublicBlogLinks(load = loadPublicBlogLinks): Promise<PublicBlogLink[]> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      load(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("Public blog index deadline exceeded")), PUBLIC_BLOG_INDEX_DEADLINE_MS);
      }),
    ]);
  } finally { if (timer) clearTimeout(timer); }
}

export function renderPublicBlogLinks(posts: PublicBlogLink[]): string {
  const links = posts.slice(0, PUBLIC_BLOG_INDEX_LIMIT)
    .filter(post => /^[a-z0-9-]{1,200}$/.test(post.slug))
    .map(post => `<li><a href="/blog/${escapeHtml(post.slug)}">${escapeHtml(post.title)}</a><p>${escapeHtml(post.excerpt)}</p></li>`).join("");
  return `<h2>Published Articles</h2>${links ? `<ul>${links}</ul>` : "<p>No published articles are available yet.</p>"}`;
}
