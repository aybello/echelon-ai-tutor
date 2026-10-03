import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("./db", () => ({ getDb: vi.fn() }));
import { getDb } from "./db";
import { jobsRouter } from "./routers/jobsRouter";
import { blogRouter } from "./routers/blogRouter";
const ctx = { user: null, req: { headers: {} }, res: {} } as any;
const jobs = jobsRouter.createCaller(ctx);
const blog = blogRouter.createCaller(ctx);
function mockRead(rows: any[] = [], error?: Error): any {
  const chain: any = {};
  for (const name of ["select", "from", "where", "orderBy", "limit", "offset"]) chain[name] = vi.fn(() => chain);
  chain.then = (resolve: any, reject: any) => (error ? Promise.reject(error) : Promise.resolve(rows)).then(resolve, reject);
  chain.execute = vi.fn().mockResolvedValue([[], []]);
  return { select: chain.select, execute: chain.execute };
}
beforeEach(() => vi.mocked(getDb).mockReset());
describe("public Jobs and Blog read reliability", () => {
  it("reports explicit retryable unavailable errors, not false empty results", async () => {
    vi.mocked(getDb).mockResolvedValue(null);
    for (const read of [() => jobs.listJobs({}), () => jobs.stats(), () => blog.listPosts(), () => blog.getPostBySlug({ slug: "fixture" }), () => blog.getRelatedPosts({ slug: "fixture" })]) {
      await expect(read()).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
    }
  });
  it("sanitizes database query failure instead of disclosing connection details", async () => {
    vi.mocked(getDb).mockResolvedValue(mockRead([], Error("synthetic-private-db-detail")));
    await expect(jobs.listJobs({})).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE", message: "Jobs is temporarily unavailable. Please retry." });
    await expect(blog.listPosts()).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE", message: "Blog is temporarily unavailable. Please retry." });
  });
  it("reserves ordinary empty results for successful reads and recovers after failure", async () => {
    vi.mocked(getDb).mockResolvedValue(null);
    await expect(blog.listPosts()).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
    vi.mocked(getDb).mockResolvedValue(mockRead([]));
    await expect(blog.listPosts()).resolves.toEqual([]);
    await expect(jobs.listJobs({ province: "ON" })).resolves.toMatchObject({ jobs: [], total: 0 });
    await expect(jobs.stats()).resolves.toMatchObject({ isStale: true, refreshStatus: "unknown", lastRefreshedAt: null });
  });
});
