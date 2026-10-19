import { beforeEach, describe, expect, it, vi } from "vitest";
import { enqueueWeeklyBlog } from "./blogWorkflowStore";

const state = vi.hoisted(() => ({ row: {} as Record<string, unknown>, statements: [] as string[] }));
vi.mock("./db", () => ({ getDb: async () => ({ transaction: async (work: (tx: unknown) => unknown) => work({
  execute: async (query: { queryChunks: unknown[] }) => {
    // Render only static SQL fragments; no production database or credentials.
    const text = JSON.stringify(query.queryChunks);
    state.statements.push(text);
    if (text.includes("SELECT")) return [[state.row]];
    return [{ affectedRows: 1 }];
  },
}) }) }));
vi.mock("./_core/databaseCutover", () => ({ databaseWritesFrozen: () => false }));
const NOW = new Date("2026-10-19T14:00:00Z");
const uncertain = { phase: "draft-submit", revision: 0, submissionPending: true };
beforeEach(() => {
  state.row = { runKey: "weekly:2026-10-12", status: "failed", progress: JSON.stringify(uncertain) };
  state.statements = [];
});
const updated = () => state.statements.some(text => text.includes("UPDATE blog_automation_runs"));
describe("weekly blog enqueue evidence fence", () => {
  it("does not replace last week's uncertain paid submission on Monday", async () => {
    expect(await enqueueWeeklyBlog(NOW)).toEqual({ ok: true, action: "failed_requires_inspection" });
    expect(updated()).toBe(false);
  });
  it("keeps definitely-unsent evidence diagnostic-only, not automatic retry authorization", async () => {
    state.row.progress = JSON.stringify({ ...uncertain, submissionNotSent: true });
    expect((await enqueueWeeklyBlog(NOW)).action).toBe("failed_requires_inspection");
    expect(updated()).toBe(false);
  });
  it.each(["not JSON", "null", "[]", "{}"])("fails closed rather than discard invalid prior progress %s", async progress => {
    state.row.progress = progress;
    expect((await enqueueWeeklyBlog(NOW)).action).toBe("failed_requires_inspection");
    expect(updated()).toBe(false);
  });
  it("does not discard a failed run with a saved response awaiting reconciliation", async () => {
    state.row.progress = JSON.stringify({ phase: "draft-poll", revision: 0, responseId: "resp_fixture" });
    expect((await enqueueWeeklyBlog(NOW)).action).toBe("failed_requires_inspection");
    expect(updated()).toBe(false);
  });
  it("allows the next independent week after a completed run", async () => {
    state.row = { runKey: "weekly:2026-10-12", status: "completed", progress: JSON.stringify({ phase: "publish", revision: 0 }) };
    expect((await enqueueWeeklyBlog(NOW)).action).toBe("queued");
    expect(updated()).toBe(true);
  });
  it("continues to allow an empty completed bootstrap placeholder", async () => {
    state.row = { runKey: "", status: "completed", progress: "{}" };
    expect((await enqueueWeeklyBlog(NOW)).action).toBe("queued");
  });
  it("does not disrupt an active prior run", async () => {
    state.row.status = "processing";
    expect((await enqueueWeeklyBlog(NOW)).action).toBe("already_queued");
    expect(updated()).toBe(false);
  });
});
