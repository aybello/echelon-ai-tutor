import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";
import { blogPosts } from "../drizzle/schema";
import { claimBlogStep, enqueueWeeklyBlog } from "./blogWorkflowStore";
import { BLOG_TOPICS, type BlogPostInsert } from "./blogAutomation";
import type { BlogProgress } from "./blogWorkflow";
const state = vi.hoisted(() => ({ db: null as any, frozen: false }));
vi.mock("./db", () => ({ getDb: async () => state.db }));
vi.mock("./_core/databaseCutover", () => ({ databaseWritesFrozen: () => state.frozen }));
const suite = process.env.BLOG_INTEGRATION_TEST_DB === "1" ? describe : describe.skip;
let pool: mysql.Pool;
const NOW = new Date("2098-10-06T14:00:00Z");
const topic = { ...BLOG_TOPICS[0], slug: "fixture-approved-blog" };
const post: BlogPostInsert = { slug: topic.slug, title: "Isolated fixture article", excerpt: "Fictional test data", content: "<p>Fictional data only.</p>", tags: "Automated Article", published: 1, publishedAt: new Date(), metaTitle: "Fixture article", metaDescription: "Fixture metadata", readingTimeMinutes: 4 };
const approved = { phase: "publish", topic, article: {}, research: [], revision: 0, approved: true } as unknown as BlogProgress;
suite("durable blog with an explicitly disposable database", () => {
  beforeAll(async () => {
    const url = new URL(process.env.DATABASE_URL!);
    if (!["127.0.0.1", "localhost"].includes(url.hostname) || !["/echelon_blog_test", "/echelon_ci"].includes(url.pathname))
      throw new Error("Blog lifecycle tests require a designated local disposable database");
    pool = mysql.createPool({ uri: url.toString(), connectionLimit: 4, timezone: "Z" });
    state.db = drizzle(pool);
    await state.db.execute(sql`SELECT id FROM blog_automation_runs LIMIT 1`);
  });
  beforeEach(async () => {
    state.frozen = false;
    await state.db.execute(sql`DELETE FROM blog_automation_runs WHERE id = 'weekly-echelon-blog'`);
    await state.db.execute(sql`DELETE FROM blog_posts WHERE slug LIKE 'fixture-%'`);
  });
  afterAll(async () => {
    if (!pool) return;
    await state.db.execute(sql`DELETE FROM blog_automation_runs WHERE id = 'weekly-echelon-blog'`);
    await state.db.execute(sql`DELETE FROM blog_posts WHERE slug LIKE 'fixture-%'`);
    await pool.end();
  });
  it("deduplicates weekly enqueue and only lets one replica own a step", async () => {
    const queued = await Promise.all([enqueueWeeklyBlog(NOW), enqueueWeeklyBlog(NOW)]);
    expect(queued.map(x => x.action).sort()).toEqual(["already_queued", "queued"]);
    const claims = await Promise.all([claimBlogStep(), claimBlogStep()]);
    expect(claims.filter(Boolean)).toHaveLength(1);
    const first = claims.find(Boolean)!;
    await first.save({ phase: "research", topic, revision: 0 });
    const restart = (await claimBlogStep())!;
    expect(restart.run.progress.phase).toBe("research");
    await restart.complete("fixture_complete");
    expect((await enqueueWeeklyBlog(NOW)).action).toBe("already_completed");
    expect(await claimBlogStep()).toBeNull();
  });
  it("fences a stale replica after its lease expires", async () => {
    await enqueueWeeklyBlog(NOW); const first = (await claimBlogStep())!;
    await state.db.execute(sql`UPDATE blog_automation_runs SET leaseUntil = DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 MINUTE) WHERE id = 'weekly-echelon-blog'`);
    const second = (await claimBlogStep())!;
    await expect(first.save({ phase: "research", topic, revision: 0 })).rejects.toThrow("lost ownership");
    await second.complete("fixture_complete");
  });
  it("keeps paid submission intent after a process dies before recording its response", async () => {
    await enqueueWeeklyBlog(NOW); const first = (await claimBlogStep())!;
    await first.checkpoint({ phase: "draft-submit", topic, revision: 0, submissionPending: true });
    await state.db.execute(sql`UPDATE blog_automation_runs SET leaseUntil = DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 MINUTE) WHERE id = 'weekly-echelon-blog'`);
    const restarted = (await claimBlogStep())!;
    expect(restarted.run.progress.submissionPending).toBe(true);
    await restarted.fail("fixture_uncertain");
    expect((await enqueueWeeklyBlog(NOW)).action).toBe("failed_requires_inspection");
  });
  it("publishes and completes in one transaction, rejecting completed replays", async () => {
    await enqueueWeeklyBlog(NOW); const step = (await claimBlogStep())!;
    await step.save(approved); const publisher = (await claimBlogStep())!;
    expect(await publisher.publish(post)).toBe("published");
    await expect(publisher.publish(post)).rejects.toThrow("lost ownership");
    const [rows] = await state.db.execute(sql`SELECT status FROM blog_automation_runs WHERE id = 'weekly-echelon-blog'`);
    expect(rows[0].status).toBe("completed");
    const [posts] = await state.db.execute(sql`SELECT COUNT(*) AS total FROM blog_posts WHERE slug = ${topic.slug}`);
    expect(Number(posts[0].total)).toBe(1);
  });
  it("does not write unapproved content or publish under a maintenance freeze", async () => {
    await enqueueWeeklyBlog(NOW); const step = (await claimBlogStep())!;
    await expect(step.publish(post)).rejects.toThrow("not approved");
    state.frozen = true;
    await expect(step.publish(post)).rejects.toThrow("maintenance");
    state.frozen = false; await step.fail("fixture_not_approved");
  });
  it("deduplicates existing slugs and recent publications inside the transaction", async () => {
    await state.db.insert(blogPosts).values(post);
    await enqueueWeeklyBlog(NOW); let step = (await claimBlogStep())!; await step.save(approved); step = (await claimBlogStep())!;
    expect(await step.publish(post)).toBe("already_published");
    await state.db.execute(sql`DELETE FROM blog_automation_runs WHERE id = 'weekly-echelon-blog'`);
    await enqueueWeeklyBlog(NOW); step = (await claimBlogStep())!;
    const next = { ...post, slug: "fixture-second-blog" };
    await step.save({ ...approved, topic: { ...topic, slug: next.slug } }); step = (await claimBlogStep())!;
    expect(await step.publish(next)).toBe("recent_article");
  });
  it("rolls back the article insert if completing the run fails", async () => {
    await enqueueWeeklyBlog(NOW); let step = (await claimBlogStep())!; await step.save(approved); step = (await claimBlogStep())!;
    await state.db.execute(sql`CREATE TRIGGER fixture_blog_completion BEFORE UPDATE ON blog_automation_runs FOR EACH ROW BEGIN IF NEW.status = 'completed' THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'fixture commit failure'; END IF; END`);
    try {
      await expect(step.publish(post)).rejects.toThrow();
      const [rows] = await state.db.execute(sql`SELECT COUNT(*) AS total FROM blog_posts WHERE slug = ${topic.slug}`);
      expect(Number(rows[0].total)).toBe(0);
    } finally { await state.db.execute(sql`DROP TRIGGER fixture_blog_completion`); }
  });
});
