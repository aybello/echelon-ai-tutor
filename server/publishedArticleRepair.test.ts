import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { repairPublishedArticle } from "./publishedArticleRepair";
import { ontarioMathGuide } from "./content/ontarioMathGuide.mjs";
import { injectBlogPostMeta } from "./blogSsr";
import { blogRouter } from "./routers/blogRouter";
import { getDb } from "./db";
vi.mock("./db", () => ({ getDb: vi.fn() }));
const old = { ...ontarioMathGuide, id: 9, published: 1, publishedAt: new Date("2026-01-01"), updatedAt: new Date("2026-01-01"),
  content: readFileSync(new URL("./__fixtures__/legacyOntarioMathGuide.html", import.meta.url), "utf8") };
describe("published math article repair", () => {
  it("replaces the exact old content without modifying the stored object or its identity", () => {
    const repaired = repairPublishedArticle(old);
    expect(repaired.content).toBe(ontarioMathGuide.content);
    expect(repaired).toMatchObject({ id: old.id, published: 1, publishedAt: old.publishedAt });
    expect(old.content).toContain("does not provide a formula sheet");
  });
  it("leaves future edits, other articles, drafts and corrected articles alone", () => {
    for (const post of [{ ...old, content: "A future independently reviewed article" }, { ...old, slug: "other" },
      { ...old, published: 0 }, { ...old, content: ontarioMathGuide.content }]) expect(repairPublishedArticle(post)).toBe(post);
  });
  it("serves the same corrected content through the actual public router and crawler HTML", async () => {
    const db: any = { select: vi.fn(), from: vi.fn(), where: vi.fn(), limit: vi.fn().mockResolvedValue([old]) };
    for (const key of ["select", "from", "where"]) db[key].mockReturnValue(db);
    vi.mocked(getDb).mockResolvedValue(db);
    const caller = blogRouter.createCaller({ user: null, req: { headers: {} }, res: {} } as any);
    const returned = await caller.getPostBySlug({ slug: old.slug });
    expect(returned?.content).toBe(ontarioMathGuide.content);
    const html = injectBlogPostMeta('<html><head></head><body><div id="root"></div></body></html>', old);
    expect(html).toContain("Guidance reviewed September 13, 2026");
    expect(html).toContain("formula/conversion tables");
    expect(html).not.toContain("does not provide a formula sheet");
    db.limit.mockResolvedValue([]);
    expect(await caller.getPostBySlug({ slug: old.slug })).toBeNull();
  });
});

describe("legacy summaries and independent editorial changes", () => {
  const legacyExcerpt = "Math questions account for 20% of every Ontario water operator exam. This guide covers the 15 essential formulas you must memorize, with worked examples for the most common calculation types.";
  it("preserves a newer title, SEO description and reading time while repairing unchanged old fields", () => {
    const post = { ...old, title: "Editor title", metaTitle: "Editor SEO title", metaDescription: "Editor description", readingTimeMinutes: 14, excerpt: legacyExcerpt };
    expect(repairPublishedArticle(post)).toMatchObject({ title: post.title, metaTitle: post.metaTitle, metaDescription: post.metaDescription,
      readingTimeMinutes: 14, excerpt: ontarioMathGuide.excerpt, content: ontarioMathGuide.content });
  });
  it("repairs actual list and related-post projections without loading full article bodies", async () => {
    const { content: _content, ...summary } = { ...old, excerpt: legacyExcerpt };
    const queue: unknown[][] = [[summary], [{ tags: "math" }], [summary]];
    const db = { select: vi.fn(() => {
      const result = queue.shift();
      const chain: any = { from: () => chain, where: () => chain, orderBy: () => chain, limit: () => chain,
        then: (resolve: any, reject: any) => Promise.resolve(result).then(resolve, reject) };
      return chain;
    }) };
    vi.mocked(getDb).mockResolvedValue(db as any);
    const caller = blogRouter.createCaller({ user: null, req: { headers: {} }, res: {} } as any);
    for (const posts of [await caller.listPosts(), await caller.getRelatedPosts({ slug: "another-post", limit: 3 })]) {
      expect(posts[0].excerpt).toBe(ontarioMathGuide.excerpt);
      expect(posts[0]).not.toHaveProperty("content");
    }
  });
});
