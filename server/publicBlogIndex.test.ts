import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("./db", () => ({ getDb: vi.fn() }));
import { getDb } from "./db";
import { loadPublicBlogLinks, boundedPublicBlogLinks, renderPublicBlogLinks, PUBLIC_BLOG_INDEX_LIMIT, PUBLIC_BLOG_INDEX_DEADLINE_MS } from "./publicBlogIndex";
import { MySqlDialect } from "drizzle-orm/mysql-core";
import type { SQL } from "drizzle-orm";
import { blogPosts } from "../drizzle/schema";

afterEach(() => { vi.useRealTimers(); vi.clearAllMocks(); });
describe("public blog index", () => {
  it("queries only published public fields and limits the ordered database read", async () => {
    const limit = vi.fn(async (_count: number) => [{ slug: "published-post", title: "Published", excerpt: "Public summary" }]);
    const orderBy = vi.fn((..._expressions: SQL[]) => ({ limit }));
    const where = vi.fn((_predicate: SQL) => ({ orderBy }));
    const from = vi.fn((_table: typeof blogPosts) => ({ where }));
    const select = vi.fn((_fields: Pick<typeof blogPosts, "slug" | "title" | "excerpt">) => ({ from }));
    vi.mocked(getDb).mockResolvedValue({ select } as unknown as NonNullable<Awaited<ReturnType<typeof getDb>>>);
    expect(await loadPublicBlogLinks()).toEqual([{ slug: "published-post", title: "Published", excerpt: "Public summary" }]);
    expect(Object.keys(select.mock.calls[0][0])).toEqual(["slug", "title", "excerpt"]);
    const clause = new MySqlDialect().sqlToQuery(where.mock.calls[0][0]);
    expect(clause.sql).toContain("`blog_posts`.`published`"); expect(clause.params).toEqual([1]);
    expect(limit).toHaveBeenCalledWith(PUBLIC_BLOG_INDEX_LIMIT); expect(orderBy.mock.calls[0]).toHaveLength(2);
  });
  it("bounds waiting without turning failure into a successful empty list", async () => {
    vi.useFakeTimers(); const pending = boundedPublicBlogLinks(() => new Promise(() => {}));
    const rejection = expect(pending).rejects.toThrow("deadline exceeded");
    await vi.advanceTimersByTimeAsync(PUBLIC_BLOG_INDEX_DEADLINE_MS); await rejection;
    expect(vi.getTimerCount()).toBe(0);
    await expect(boundedPublicBlogLinks(async () => [])).resolves.toEqual([]); expect(vi.getTimerCount()).toBe(0);
  });
  it("rejects unsafe slug paths and escapes all public article labels", () => {
    const html = renderPublicBlogLinks([{ slug: "safe-post", title: '<img onerror="bad"> $&', excerpt: "<script>bad</script>" }, { slug: '" onclick="bad', title: "Hidden", excerpt: "" }]);
    expect(html).toContain('href="/blog/safe-post"'); expect(html).toContain("&lt;img"); expect(html).not.toContain("<script>"); expect(html).not.toContain("Hidden");
    const large = renderPublicBlogLinks(Array.from({ length: 200 }, (_, i) => ({ slug: `post-${i}`, title: "Title", excerpt: "Summary" })));
    expect(large.match(/href=/g)).toHaveLength(PUBLIC_BLOG_INDEX_LIMIT);
  });
});
