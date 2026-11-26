import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MySqlDialect } from "drizzle-orm/mysql-core";
import { assessmentActivityEvents, assessmentActivitySessions, organizationMembers, organizations, teamFlexLicences } from "../drizzle/schema";
const mocks = vi.hoisted(() => ({ getDb: vi.fn() }));
vi.mock("./db", () => mocks);
vi.mock("./_core/env", () => ({ ENV: { cookieSecret: "learner-view-test-only-secret" } }));
import { adminAssessmentScope, annualAssessmentScope, assessmentActorFilter, assessmentReadPredicate, flexAssessmentScope, learnerAssessmentDetailInput, parseIssuedAssessmentItems, readAssessmentDetails } from "./assessmentActivityRead";
const dialect = new MySqlDialect();
const sqlQuery = (value: unknown) => dialect.sqlToQuery(value as never);
const now = new Date("2026-11-19T02:00:00Z");
function mockDb(rows: Map<unknown, unknown[]>) {
  const calls: { table?: unknown; conditions?: unknown; limit?: number }[] = [];
  const select = () => {
    const call: typeof calls[number] = {}; calls.push(call);
    const query = { from: (table: unknown) => { call.table = table; return query; }, innerJoin: () => query,
      where: (conditions: unknown) => { call.conditions = conditions; return query; }, orderBy: () => query,
      limit: (limit: number) => { call.limit = limit; return Promise.resolve(rows.get(call.table) ?? []); } };
    return query;
  };
  mocks.getDb.mockResolvedValue({ select }); return calls;
}
beforeEach(() => vi.clearAllMocks());
describe("learner-view exact observed read scope", () => {
  it("keeps user and verified-email namespaces disjoint, never anonymous", () => {
    const user = sqlQuery(assessmentActorFilter({ userId: 42 }));
    const email = sqlQuery(assessmentActorFilter({ email: " PERSON@example.test " }));
    expect(user.params).toEqual(["user", 42]);
    expect(email.params[0]).toBe("verified-email");
    expect(email.params[1]).toMatch(/^[a-f0-9]{64}$/);
    expect(email.sql).toContain("`userId` is null");
    expect(JSON.stringify(email)).not.toContain("person@example.test");
    expect(JSON.stringify(user)).not.toContain("anonymous");
  });
  it("intersects history with a recorded lifecycle and observed source", () => {
    const scope = { ...adminAssessmentScope({ userId: 42 }), startsAt: now.getTime() - 1000, endsAt: now.getTime() + 1000 };
    const result = assessmentReadPredicate(scope, 30, now.getTime());
    expect(result.since).toBe(scope.startsAt); expect(result.until).toBe(now.getTime());
    expect(sqlQuery(result.predicate).sql).toContain("`startedAt` < ?");
    expect(sqlQuery(result.predicate).params).toContain("observed");
  });
  it("refuses cross-org Annual membership before any assessment query", async () => {
    const calls = mockDb(new Map([[organizations, [{ id: 9 }]]]));
    await expect(annualAssessmentScope(9, 44)).rejects.toMatchObject({ code: "NOT_FOUND" });
    const query = sqlQuery(calls[0].conditions);
    expect(query.params).toEqual([44, 9, "operator"]);
    expect(calls.some(call => call.table === assessmentActivitySessions)).toBe(false);
  });
  it("binds Annual rows to exact member, org, course and actor without Flex spill", async () => {
    mockDb(new Map<unknown, unknown[]>([
      [organizationMembers, [{ id: 44, orgId: 9, email: "person@example.test", role: "operator", status: "assigned", courseKey: "oit", courseKeys: null, assignedAt: new Date(now.getTime() - 10000), revokedAt: null }]],
      [organizations, [{ id: 9, termStart: new Date(now.getTime() - 20000), termEnd: new Date(now.getTime() + 20000) }]],
    ]));
    const scope = await annualAssessmentScope(9, 44);
    const query = sqlQuery(scope.predicate);
    expect(query.sql).toContain("`organizationMemberId` = ?");
    expect(query.sql).toContain("`flexLicenceId` is null");
    expect(query.sql).toContain("exists (select 1");
    expect(query.params).toEqual(expect.arrayContaining([9, 44, "oit", "user", "verified-email"]));
    expect(scope.startsAt).toBe(now.getTime() - 10000);
  });
  it("does not manufacture a missing Annual term start", async () => {
    mockDb(new Map<unknown, unknown[]>([
      [organizationMembers, [{ id: 44, orgId: 9, role: "operator", status: "assigned", assignedAt: now }]],
      [organizations, [{ id: 9, termStart: null, termEnd: new Date(now.getTime() + 20000) }]],
    ]));
    await expect(annualAssessmentScope(9, 44)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
  it("refuses cross-org Flex licence IDs with exact organization SQL", async () => {
    const calls = mockDb(new Map());
    await expect(flexAssessmentScope(9, 88)).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(sqlQuery(calls[0].conditions).params).toEqual([88, 9]);
  });
  it("validates event page bounds and rejects arbitrary identity fields", () => {
    const valid = { sessionId: "11111111-1111-4111-8111-111111111111", days: 30 };
    expect(learnerAssessmentDetailInput.parse(valid).cursor).toBe(0);
    expect(learnerAssessmentDetailInput.safeParse({ ...valid, cursor: 3001 }).success).toBe(false);
    expect(learnerAssessmentDetailInput.safeParse({ ...valid, email: "other@example.test" }).success).toBe(false);
  });
  it("rejects unknown snapshot fields instead of presenting current bank text", () => {
    const item = { id: "q1", prompt: "Issued prompt", options: [{ id: "0", text: "Issued choice" }], steps: [] };
    expect(parseIssuedAssessmentItems(JSON.stringify([item]))?.[0].prompt).toBe("Issued prompt");
    expect(parseIssuedAssessmentItems(JSON.stringify([{ ...item, correctIndex: 0 }]))).toBeNull();
    expect(parseIssuedAssessmentItems("broken")).toBeNull();
  });
  it("reapplies actor/window scope on every event page and returns only allowlisted fields", async () => {
    const json = JSON.stringify([{ id: "q1", prompt: "Exact issued prompt", options: [{ id: "0", text: "Exact choice" }], steps: [] }]);
    const calls = mockDb(new Map<unknown, unknown[]>([
      [assessmentActivitySessions, [{ sessionId: "11111111-1111-4111-8111-111111111111", issuedItemsJson: json, manifestHash: createHash("sha256").update(json).digest("hex") }]],
      [assessmentActivityEvents, Array.from({ length: 51 }, (_, index) => ({ sequence: index + 2, action: "answer_submitted", itemId: "q1", stepId: null, chosenAnswer: "0", observedCorrect: null, occurredAt: Date.now(), firstRecordedAnswer: index === 0 ? 1 : 0 }))],
    ]));
    const result = await readAssessmentDetails(adminAssessmentScope({ userId: 42 }), { sessionId: "11111111-1111-4111-8111-111111111111", cursor: 0, days: 30 });
    expect(result.events).toHaveLength(50); expect(result.nextCursor).toBe(51);
    expect(result.items?.[0].prompt).toBe("Exact issued prompt");
    const eventQuery = sqlQuery(calls[1].conditions);
    expect(eventQuery.params).toContain(42); expect(eventQuery.params).toContain("user");
    expect(eventQuery.sql).toContain("`startedAt` >= ?"); expect(eventQuery.sql).toContain("`occurredAt` <= ?");
    expect(calls[1].limit).toBe(51);
    expect(JSON.stringify(result)).not.toMatch(/manifestHash|payloadHash|actorHash|capability/);
  });
  it("wires actual UI only to independent role/manager readers and null active time", () => {
    const ui = readFileSync(new URL("../client/src/components/LearnerAssessmentDetails.tsx", import.meta.url), "utf8");
    const org = readFileSync(new URL("./routers/orgRouter.ts", import.meta.url), "utf8");
    expect(ui).toContain("trpc.orgIntel.learnerAssessmentDetails"); expect(ui).toContain("trpc.teamFlex.learnerAssessmentDetails");
    expect(ui).toContain("Active assessment time: unavailable");
    expect(org).toContain("annualAssessmentScope(orgId, input.memberId)");
  });
});

function flexFixture(changes: Record<string, unknown> = {}) {
  const startsAt = new Date(Date.now() - 20000);
  return { id: 88, organizationId: 9, status: "active", courseKey: "oit", operatorUserId: 42,
    invitedEmail: " PERSON@Example.Test ", startsAt, activatedAt: new Date(startsAt.getTime() + 1000),
    accessEndsAt: new Date(Date.now() + 86400000), reportingEndsAt: new Date(Date.now() + 172800000), ...changes };
}
describe("Flex exact-licence dual-auth SQL", () => {
  it("allows exact assigned OAuth user OR hashed invited email, never a global email history join", async () => {
    mockDb(new Map([[teamFlexLicences, [flexFixture()]]]));
    const scope = await flexAssessmentScope(9, 88);
    const query = sqlQuery(scope.predicate);
    expect(query.params).toEqual(["user", 42, "verified-email", sqlQuery(assessmentActorFilter({ email: "person@example.test" })).params[1], 9, 88, "oit"]);
    expect(query.sql).toContain(" or ");
    expect(query.sql).toContain("`organizationMemberId` is null");
    expect(query.sql).not.toContain("exists");
    expect(query.sql).not.toContain("join");
    expect(query.sql).toContain("`emailHash` is null");
    expect(query.sql).toContain("`userId` is null");
    const window = sqlQuery(assessmentReadPredicate(scope, 30).predicate);
    expect(window.params).toContain(scope.startsAt);
    expect(window.params).toContain(scope.endsAt);
    expect(window.sql).toContain("`lastObservedAt` < ?");
  });
  it("when no account ID is assigned, allows users.email EXISTS OR the normalized invited-email hash", async () => {
    mockDb(new Map([[teamFlexLicences, [flexFixture({ operatorUserId: null })]]]));
    const scope = await flexAssessmentScope(9, 88);
    const query = sqlQuery(scope.predicate);
    expect(query.params).toEqual(["user", "person@example.test", "verified-email", sqlQuery(assessmentActorFilter({ email: "person@example.test" })).params[1], 9, 88, "oit"]);
    expect(query.sql).toContain("exists (select 1 from `users`");
    expect(query.sql).toContain("`users`.`id` = `assessment_activity_sessions`.`userId`");
    expect(query.sql).toContain(" or ");
    expect(query.sql).not.toContain("join");
  });
  it("does not invent an email branch for an ID-only Flex licence", async () => {
    mockDb(new Map([[teamFlexLicences, [flexFixture({ invitedEmail: null })]]]));
    const query = sqlQuery((await flexAssessmentScope(9, 88)).predicate);
    expect(query.params).toEqual(["user", 42, 9, 88, "oit"]);
    expect(query.params).not.toContain("verified-email");
    expect(query.sql).not.toContain("exists");
  });
  it("does not authorize a Flex licence with no verifiable actor", async () => {
    mockDb(new Map([[teamFlexLicences, [flexFixture({ operatorUserId: null, invitedEmail: null })]]]));
    await expect(flexAssessmentScope(9, 88)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
