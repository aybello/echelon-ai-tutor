import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { blogPosts } from "../../drizzle/schema";
import { eq, and, desc, ne } from "drizzle-orm";

export const blogRouter = router({
  /** List all published posts, newest first */
  listPosts: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const posts = await db
      .select({
        id: blogPosts.id,
        slug: blogPosts.slug,
        title: blogPosts.title,
        excerpt: blogPosts.excerpt,
        author: blogPosts.author,
        tags: blogPosts.tags,
        readingTimeMinutes: blogPosts.readingTimeMinutes,
        publishedAt: blogPosts.publishedAt,
      })
      .from(blogPosts)
      .where(eq(blogPosts.published, 1))
      .orderBy(desc(blogPosts.publishedAt));
    return posts;
  }),

  /** Get a single post by slug */
  getPostBySlug: publicProcedure
    .input(z.object({ slug: z.string().min(1).max(200) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const [post] = await db
        .select()
        .from(blogPosts)
        .where(and(eq(blogPosts.slug, input.slug), eq(blogPosts.published, 1)))
        .limit(1);
      return post ?? null;
    }),

  /** Get 3 related posts (same tag or just latest, excluding current slug) */
  getRelatedPosts: publicProcedure
    .input(z.object({ slug: z.string(), limit: z.number().min(1).max(6).default(3) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const posts = await db
        .select({
          id: blogPosts.id,
          slug: blogPosts.slug,
          title: blogPosts.title,
          excerpt: blogPosts.excerpt,
          author: blogPosts.author,
          tags: blogPosts.tags,
          readingTimeMinutes: blogPosts.readingTimeMinutes,
          publishedAt: blogPosts.publishedAt,
        })
        .from(blogPosts)
        .where(and(eq(blogPosts.published, 1), ne(blogPosts.slug, input.slug)))
        .orderBy(desc(blogPosts.publishedAt))
        .limit(input.limit);
      return posts;
    }),
});
