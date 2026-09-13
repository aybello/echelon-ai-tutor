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
