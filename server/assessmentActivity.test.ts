import { createHash, randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
import { assessmentActivityEventSchema, assessmentActivityIssueSchema, assessmentActivityRecordInputSchema, type AssessmentActivityEvent } from "../shared/assessmentActivity";
const mocks = vi.hoisted(() => ({ getDb: vi.fn(), validateIssuedAttribution: vi.fn() }));
vi.mock("./db", () => ({ getDb: mocks.getDb }));
vi.mock("./teams/attemptAttribution", () => ({ validateIssuedAttribution: mocks.validateIssuedAttribution }));
vi.mock("./_core/env", () => ({ ENV: { cookieSecret: "fixture-assessment-activity-only" } }));
import { assessmentActivityAllowed, assessmentActivityDate, assessmentActivityEmailHash, assessmentActivityEventHash, createAssessmentActivitySecurity, issueAssessmentActivity, recordAssessmentActivity, reduceAssessmentActivityBatch, resumeAssessmentActivity, readAssessmentActivityItems } from "./assessmentActivity";

function ctx(kind: "user" | "email" | "anonymous" = "user", value: number | string = 7, headers: Record<string, string | undefined> = { "x-echelon-activity": "allowed" }): TrpcContext {
  return { user: kind === "user" ? { id: value, email: "same@example.test", role: "user" } : null,
    studentEmail: kind === "email" ? String(value) : null, req: { headers }, res: {} } as TrpcContext;
}
const issue = { courseKey: "oit", mode: "practice" as const, items: [{ id: "q1", prompt: "Reviewed exam question", options: [{ id: "0", text: "Choice A" }, { id: "1", text: "Choice B" }], steps: [{ id: "s1", label: "Formula", options: [{ id: "f1", text: "Formula A" }] }] }] };
const items = assessmentActivityIssueSchema.parse(issue).items;
const initial = { status: "active" as const, lastSequence: 1, eventCount: 1 };
const event = (overrides: Partial<AssessmentActivityEvent> = {}): AssessmentActivityEvent => ({ eventId: randomUUID(), sequence: 2, action: "answer_submitted", itemId: "q1", chosenAnswer: "0", observedCorrect: true, ...overrides });
const security = createAssessmentActivitySecurity("fixture-assessment-activity-only");
function token(context = ctx(), changes = {}) {
  const actor = security.actor(context, context.user || context.studentEmail ? undefined : "4f65f1d2-9a59-4a61-8ea5-5d205ba10a32")!;
  return security.sign({ version: 1, sessionId: randomUUID(), courseKey: "oit", mode: "practice", actorHash: actor.actorHash, identityKind: actor.identityKind,
    manifestHash: "a".repeat(64), expires: Date.now() + 60000, ...(actor.identityKind === "anonymous" ? { anonymousNonce: "4f65f1d2-9a59-4a61-8ea5-5d205ba10a32" } : {}), ...changes });
}
beforeEach(() => {
  mocks.getDb.mockReset();
  mocks.validateIssuedAttribution.mockReset().mockImplementation(async (_identity, _key, issued) => issued);
});

describe("assessment activity privacy and identity", () => {
  it.each([{}, { "x-echelon-activity": "denied" }, { "x-echelon-activity": "allowed", dnt: "1" }, { "x-echelon-activity": "allowed", "sec-gpc": "1" }])("fails closed for preference %j", async headers => {
    const context = ctx("user", 7, headers);
    expect(assessmentActivityAllowed(context)).toBe(false);
    expect(await issueAssessmentActivity(context, issue)).toMatchObject({ tracking: false });
    expect(await recordAssessmentActivity(context, { capability: token(), events: [event()] })).toMatchObject({ recorded: false });
    expect(mocks.getDb).not.toHaveBeenCalled();
  });
  it("honors OAuth preference cookie but denial wins", () => {
    expect(assessmentActivityAllowed(ctx("user", 7, { cookie: "other=1; echelon_activity_preference=allowed" }))).toBe(true);
    expect(assessmentActivityAllowed(ctx("user", 7, { cookie: "echelon_activity_preference=allowed", "x-echelon-activity": "denied" }))).toBe(false);
  });
  it("keeps account and verified email separate even for the same email", () => {
    const user = security.actor(ctx())!;
    const email = security.actor(ctx("email", " Same@Example.Test "))!;
    expect(user.userId).toBe(7); expect(user.emailHash).toBeNull();
    expect(email.userId).toBeNull(); expect(email.emailHash).toMatch(/^[a-f0-9]{64}$/);
    expect(user.actorHash).not.toBe(email.actorHash);
    expect(email).toEqual(security.actor(ctx("email", "same@example.test")));
  });
  it("anonymous actor has no identifying fields and cannot become identified", () => {
    const nonce = randomUUID();
    const actor = security.actor(ctx("anonymous"), nonce)!;
    expect(actor.userId).toBeNull(); expect(actor.emailHash).toBeNull();
    expect(actor.actorHash).not.toBe(security.actor(ctx("anonymous"), randomUUID())!.actorHash);
    const cap = token(ctx("anonymous"));
    expect(security.verify(cap, ctx("anonymous"))).not.toBeNull();
    expect(security.verify(cap, ctx())).toBeNull();
  });
  it("legacy client token/email input is not a named identity", () => {
    const anonymous = { ...ctx("anonymous"), accessToken: "legacy-token", email: "same@example.test" } as TrpcContext;
    expect(security.actor(anonymous)).toBeNull();
  });
});

describe("assessment activity capabilities", () => {
  it("accepts a valid self-only capability", () => expect(security.verify(token(), ctx())).not.toBeNull());
  it("rejects cross-account and cross-auth-method use", () => {
    const cap = token();
    expect(security.verify(cap, ctx("user", 8))).toBeNull();
    expect(security.verify(cap, ctx("email", "same@example.test"))).toBeNull();
    expect(security.verify(cap, ctx("anonymous"))).toBeNull();
  });
  it.each(["body.short", "x." + "a".repeat(64), "x." + "g".repeat(64), "x." + "a".repeat(64) + ".extra", "x".repeat(2049)])("rejects malformed/forged capability %s", cap => expect(security.verify(cap, ctx())).toBeNull());
  it("rejects tampered body and expired capability", () => {
    const cap = token(); const [body, signature] = cap.split(".");
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString()); parsed.courseKey = "class1-water";
    expect(security.verify(Buffer.from(JSON.stringify(parsed)).toString("base64url") + "." + signature, ctx())).toBeNull();
    expect(security.verify(token(ctx(), { expires: Date.now() - 1 }), ctx())).toBeNull();
  });
  it("missing server secret is fail-closed", () => {
    const missing = createAssessmentActivitySecurity("");
    expect(missing.actor(ctx())).toBeNull(); expect(missing.verify(token(), ctx())).toBeNull();
    expect(() => missing.sign({} as never)).toThrow();
  });
});

describe("assessment activity immutable reducer", () => {
  it("preserves first choice and separately appends retry and second choice", () => {
    const first = event({ observedCorrect: false });
    const retry = event({ sequence: 3, action: "retry", chosenAnswer: undefined, observedCorrect: undefined });
    const second = event({ sequence: 4, chosenAnswer: "1" });
    const reduced = reduceAssessmentActivityBatch(initial, items, [first, retry, second], []);
    expect(reduced.accepted).toEqual([first, retry, second]); expect(reduced.next.eventCount).toBe(4);
    expect(reduced.accepted[0].observedCorrect).toBe(false);
  });
  it("exact retries deduplicate within a batch and against durable events", () => {
    const value = event();
    const first = reduceAssessmentActivityBatch(initial, items, [value, value], []);
    expect(first.accepted).toHaveLength(1); expect(first.duplicates).toBe(1);
    const next = reduceAssessmentActivityBatch(first.next, items, [value], [{ eventId: value.eventId, payloadHash: assessmentActivityEventHash(value) }]);
    expect(next.accepted).toHaveLength(0); expect(next.next).toEqual(first.next);
  });
  it("UUID reuse with changed content rejects the entire request", () => {
    const value = event();
    expect(() => reduceAssessmentActivityBatch(initial, items, [value, { ...value, chosenAnswer: "1" }], [])).toThrow("payload conflict");
  });
  it.each([event({ sequence: 4 }), event({ itemId: "unissued" }), event({ chosenAnswer: "unissued" }), event({ action: "step_answer", stepId: "unissued" }), event({ action: "started" })])("rejects invalid sequence/item/choice/step/start", value => expect(() => reduceAssessmentActivityBatch(initial, items, [value], [])).toThrow());
  it("accepts only issued step-choice IDs", () => {
    expect(reduceAssessmentActivityBatch(initial, items, [event({ action: "step_answer", stepId: "s1", chosenAnswer: "f1" })], []).accepted).toHaveLength(1);
  });
  it("completion is terminal but exact duplicate completion remains idempotent", () => {
    const completed = event({ action: "completed", itemId: undefined, chosenAnswer: undefined, observedCorrect: undefined });
    const done = reduceAssessmentActivityBatch(initial, items, [completed], []);
    expect(done.next.status).toBe("completed");
    expect(() => reduceAssessmentActivityBatch(done.next, items, [event({ sequence: 3 })], [])).toThrow();
    expect(reduceAssessmentActivityBatch(done.next, items, [event({ sequence: 3, action: "resumed", itemId: undefined, chosenAnswer: undefined, observedCorrect: undefined })], []).next.status).toBe("completed");
    expect(reduceAssessmentActivityBatch(done.next, items, [completed], [{ eventId: completed.eventId, payloadHash: assessmentActivityEventHash(completed) }]).duplicates).toBe(1);
  });
  it("abandoned cannot be reopened", () => expect(() => reduceAssessmentActivityBatch({ ...initial, status: "abandoned" }, items, [event()], [])).toThrow());
  it("caps durable event count at 3000", () => expect(() => reduceAssessmentActivityBatch({ ...initial, lastSequence: 3000, eventCount: 3000 }, items, [event({ sequence: 3001 })], [])).toThrow());
  it("hashes exact optional boolean distinctions and ignores object key ordering", () => {
    const value = event();
    expect(assessmentActivityEventHash(value)).toBe(assessmentActivityEventHash({ ...value, observedCorrect: true }));
    expect(assessmentActivityEventHash(value)).not.toBe(assessmentActivityEventHash({ ...value, observedCorrect: false }));
  });
});

describe("assessment activity bounds and fail isolation", () => {
  it("rejects arbitrary PII, metadata, timestamps and identity on write", () => {
    expect(assessmentActivityRecordInputSchema.safeParse({ capability: token(), events: [event()], email: "victim@example.test" }).success).toBe(false);
    expect(assessmentActivityEventSchema.safeParse({ ...event(), metadata: { studentName: "Student" } }).success).toBe(false);
    expect(assessmentActivityEventSchema.safeParse({ ...event(), occurredAt: Date.now() }).success).toBe(false);
  });
  it("supports native 110-question mocks but bounds every snapshot dimension", () => {
    expect(assessmentActivityIssueSchema.safeParse({ ...issue, mode: "mock", items: Array.from({ length: 110 }, (_, index) => ({ ...issue.items[0], id: `q${index}` })) }).success).toBe(true);
    expect(assessmentActivityIssueSchema.safeParse({ ...issue, items: Array.from({ length: 151 }, (_, index) => ({ ...issue.items[0], id: `q${index}` })) }).success).toBe(false);
    expect(assessmentActivityIssueSchema.safeParse({ ...issue, items: [{ ...issue.items[0], prompt: "x".repeat(2001) }] }).success).toBe(false);
    expect(assessmentActivityIssueSchema.safeParse({ ...issue, items: [{ ...issue.items[0], options: Array.from({ length: 25 }, (_, index) => ({ id: String(index), text: "choice" })) }] }).success).toBe(false);
    expect(assessmentActivityIssueSchema.safeParse({ ...issue, items: [{ ...issue.items[0], steps: Array.from({ length: 25 }, (_, index) => ({ id: String(index), label: "step" })) }] }).success).toBe(false);
    expect(assessmentActivityRecordInputSchema.safeParse({ capability: token(), events: Array.from({ length: 26 }, () => event()) }).success).toBe(false);
  });
  it("never gates the assessment on unavailable database", async () => {
    mocks.getDb.mockResolvedValue(null);
    expect(await issueAssessmentActivity(ctx(), issue)).toMatchObject({ tracking: false });
    expect(await recordAssessmentActivity(ctx(), { capability: token(), events: [event()] })).toMatchObject({ recorded: false });
  });
  it("isolates a failed transaction and rejects anonymous org attribution", async () => {
    mocks.getDb.mockResolvedValue({ transaction: vi.fn().mockRejectedValue(new Error("mock db failure")) });
    expect(await issueAssessmentActivity(ctx(), issue)).toMatchObject({ tracking: false });
    expect(await issueAssessmentActivity(ctx("anonymous"), issue, { orgId: 1, organizationMemberId: 2, flexLicenceId: null })).toMatchObject({ tracking: false });
  });
  it("issues server timestamps and immutable start in a single mocked transaction", async () => {
    const writes: unknown[] = [];
    const tx = { insert: vi.fn().mockReturnValue({ values: vi.fn(async values => { writes.push(values); }) }) };
    mocks.getDb.mockResolvedValue({ transaction: async (callback: (arg: typeof tx) => unknown) => callback(tx) });
    const result = await issueAssessmentActivity(ctx(), issue, { orgId: 1, organizationMemberId: 2, flexLicenceId: null });
    expect(result.tracking).toBe(true);
    expect(writes).toHaveLength(2);
    expect(writes[0]).toMatchObject({ userId: 7, emailHash: null, orgId: 1, activeSeconds: null, itemCount: 1, source: "observed" });
    expect(writes[1]).toMatchObject({ action: "issued", sequence: 1, source: "observed" });
    expect(typeof (writes[0] as { startedAt: number }).startedAt).toBe("number");
  });
  it("converts UTC milliseconds only at read boundary", () => {
    expect(assessmentActivityDate(0)).toBe("1970-01-01T00:00:00.000Z"); expect(assessmentActivityDate(null)).toBeNull();
  });
  it("hydrates owned sequence without reopening or returning snapshots", async () => {
    const context = ctx();
    const manifest = JSON.stringify(items);
    const manifestHash = createHash("sha256").update(manifest).digest("hex");
    const cap = token(context, { manifestHash });
    const verified = security.verify(cap, context)!;
    const session = { ...verified, expiresAt: verified.expires, issuedItemsJson: manifest, status: "completed", lastSequence: 7 };
    mocks.getDb.mockResolvedValue({ select: () => ({ from: () => ({ where: () => ({ limit: async () => [session] }) }) }) });
    expect(await resumeAssessmentActivity(context, { capability: cap })).toMatchObject({ tracking: true, nextSequence: 8, status: "completed" });
    expect(await resumeAssessmentActivity(ctx("user", 8), { capability: cap })).toMatchObject({ tracking: false });
    expect(await resumeAssessmentActivity(ctx("user", 7, { "x-echelon-activity": "denied" }), { capability: cap })).toMatchObject({ tracking: false });
  });
  it("records timeout without inventing a choice and validates transient choice observations", () => {
    const timeout = event({ action: "timed_out", chosenAnswer: undefined, observedCorrect: undefined });
    expect(reduceAssessmentActivityBatch(initial, items, [timeout], []).accepted).toHaveLength(1);
    expect(() => reduceAssessmentActivityBatch(initial, items, [event({ action: "selection_changed", observedCorrect: undefined, chosenAnswer: "invented" })], [])).toThrow();
    expect(reduceAssessmentActivityBatch(initial, items, [event({ action: "selection_changed", observedCorrect: undefined })], []).accepted).toHaveLength(1);
  });
  it("reader email hashes match verified-email actors and snapshot tampering fails closed", () => {
    expect(assessmentActivityEmailHash(" Same@Example.Test ")).toBe(security.actor(ctx("email", "same@example.test"))!.emailHash);
    const json = JSON.stringify(items);
    const hash = createHash("sha256").update(json).digest("hex");
    expect(readAssessmentActivityItems(json, hash)).toEqual(items);
    expect(readAssessmentActivityItems(json.replace("Reviewed", "Edited"), hash)).toBeNull();
  });
  it("server issuance does not claim participation; only later observed started is accepted", () => {
    expect(() => reduceAssessmentActivityBatch(initial, items, [event({ action: "issued", itemId: undefined, chosenAnswer: undefined, observedCorrect: undefined })], [])).toThrow();
    expect(reduceAssessmentActivityBatch(initial, items, [event({ action: "started", itemId: undefined, chosenAnswer: undefined, observedCorrect: undefined })], []).accepted).toHaveLength(1);
  });
});

// No database: exercise the real record path against a locked, durable-row fixture.
const annualOwnership = { orgId: 1, organizationMemberId: 2, flexLicenceId: null };
const personalOwnership = { orgId: null, organizationMemberId: null, flexLicenceId: null };
function recordFixture(context = ctx(), ownership: { orgId: number | null; organizationMemberId: number | null; flexLicenceId: number | null } = annualOwnership) {
  const issuedItemsJson = JSON.stringify(items);
  const manifestHash = createHash("sha256").update(issuedItemsJson).digest("hex");
  const capability = token(context, { manifestHash });
  const cap = security.verify(capability, context)!;
  const row = { ...cap, ...security.actor(context)!, ...ownership, expiresAt: cap.expires, issuedItemsJson, ...initial };
  const stored: { eventId: string; payloadHash: string }[] = [];
  const writes: { kind: string; values: Record<string, unknown> | Record<string, unknown>[] }[] = [];
  const lock = vi.fn(async () => [row]);
  let selects = 0;
  const tx = {
    select: () => ({ from: () => ({ where: () => ++selects % 2 === 1 ? { limit: () => ({ for: lock }) } : Promise.resolve(stored) }) }),
    update: vi.fn(() => ({ set: (values: Record<string, unknown>) => ({ where: async () => {
      writes.push({ kind: "update", values }); Object.assign(row, values);
    } }) })),
    insert: vi.fn(() => ({ values: async (values: Record<string, unknown>[]) => {
      writes.push({ kind: "events", values });
      stored.push(...values.map(value => ({ eventId: String(value.eventId), payloadHash: String(value.payloadHash) })));
    } })),
  };
  mocks.getDb.mockResolvedValue({ transaction: async (callback: (value: typeof tx) => unknown) => callback(tx) });
  return { row, writes, tx, lock, capability, record: (events: AssessmentActivityEvent[]) => recordAssessmentActivity(context, { capability, events }) };
}

describe("observation attribution privacy under the session lock", () => {
  it("revalidates a matching Annual assignment once per accepted batch with verified OAuth identity", async () => {
    const fixture = recordFixture();
    expect(await fixture.record([event(), event({ sequence: 3 })])).toMatchObject({ accepted: 2 });
    expect(fixture.lock).toHaveBeenCalledWith("update");
    expect(mocks.validateIssuedAttribution).toHaveBeenCalledTimes(1);
    expect(mocks.validateIssuedAttribution).toHaveBeenCalledWith({ userId: 7, studentEmail: "same@example.test" }, "oit", expect.objectContaining(annualOwnership), fixture.tx);
    expect(fixture.writes.map(write => write.kind)).toEqual(["events", "update"]);
    expect(fixture.row).toMatchObject(annualOwnership);
  });
  it("clears every employer field before accepting observations during revocation", async () => {
    const fixture = recordFixture();
    mocks.validateIssuedAttribution.mockResolvedValue(personalOwnership);
    expect(await fixture.record([event()])).toMatchObject({ recorded: true, accepted: 1 });
    expect(fixture.writes[0]).toEqual({ kind: "update", values: personalOwnership });
    expect(fixture.writes[1].kind).toBe("events");
    expect(fixture.row).toMatchObject(personalOwnership);
  });
  it("reactivation cannot restore a previously cleared session or expose its earlier observations", async () => {
    const fixture = recordFixture();
    mocks.validateIssuedAttribution.mockResolvedValueOnce(personalOwnership);
    await fixture.record([event()]);
    mocks.validateIssuedAttribution.mockResolvedValue(annualOwnership);
    expect(await fixture.record([event({ sequence: 3 })])).toMatchObject({ accepted: 1 });
    expect(mocks.validateIssuedAttribution).toHaveBeenCalledTimes(1);
    expect(fixture.row).toMatchObject(personalOwnership);
    expect(fixture.writes.filter(write => write.kind === "update").every(write => (write.values as Record<string, unknown>).orgId !== 1)).toBe(true);
  });
  it.each([
    { orgId: 3, organizationMemberId: 4, flexLicenceId: null },
    { orgId: 1, organizationMemberId: 99, flexLicenceId: null },
    { orgId: 1, organizationMemberId: null, flexLicenceId: 8 },
  ])("does not reassign mismatched org/member/licence attribution %j", async current => {
    const fixture = recordFixture();
    mocks.validateIssuedAttribution.mockResolvedValue(current);
    expect(await fixture.record([event()])).toMatchObject({ accepted: 1 });
    expect(fixture.row).toMatchObject(personalOwnership);
    expect(fixture.writes[0]).toEqual({ kind: "update", values: personalOwnership });
  });
  it("resolver failure permanently clears employer attribution instead of leaking a new observation", async () => {
    const fixture = recordFixture();
    mocks.validateIssuedAttribution.mockRejectedValue(new Error("resolver unavailable"));
    expect(await fixture.record([event()])).toMatchObject({ accepted: 1 });
    expect(fixture.writes[0]).toEqual({ kind: "update", values: personalOwnership });
    expect(fixture.row).toMatchObject(personalOwnership);
  });
  it("does not insert new observations if clearing attribution fails", async () => {
    const fixture = recordFixture();
    mocks.validateIssuedAttribution.mockResolvedValue(personalOwnership);
    fixture.tx.update.mockImplementation(() => { throw new Error("cannot clear attribution"); });
    expect(await fixture.record([event()])).toMatchObject({ recorded: false });
    expect(fixture.tx.insert).not.toHaveBeenCalled();
  });
  it("exact duplicate delivery neither writes nor needs revalidation", async () => {
    const fixture = recordFixture(); const answer = event();
    await fixture.record([answer]); fixture.writes.length = 0;
    mocks.validateIssuedAttribution.mockClear();
    expect(await fixture.record([answer])).toMatchObject({ accepted: 0, duplicates: 1 });
    expect(fixture.writes).toEqual([]);
    expect(mocks.validateIssuedAttribution).not.toHaveBeenCalled();
  });
  it("uses normalized verified-email identity for a Flex assignment", async () => {
    const ownership = { orgId: 1, organizationMemberId: null, flexLicenceId: 8 };
    const fixture = recordFixture(ctx("email", " Learner@Example.Test "), ownership);
    expect(await fixture.record([event()])).toMatchObject({ accepted: 1 });
    expect(mocks.validateIssuedAttribution).toHaveBeenCalledWith({ userId: null, studentEmail: "learner@example.test" }, "oit", expect.objectContaining(ownership), fixture.tx);
    expect(fixture.row).toMatchObject(ownership);
  });
  it("never discovers an employer for an originally learner-only session", async () => {
    const fixture = recordFixture(ctx(), personalOwnership);
    mocks.validateIssuedAttribution.mockResolvedValue(annualOwnership);
    expect(await fixture.record([event()])).toMatchObject({ accepted: 1 });
    expect(mocks.validateIssuedAttribution).not.toHaveBeenCalled();
    expect(fixture.row).toMatchObject(personalOwnership);
  });
  it.each(["revoked", "failure"])("issuance is learner-only when trusted attribution becomes %s", async reason => {
    const writes: unknown[] = [];
    const tx = { insert: () => ({ values: async (value: unknown) => { writes.push(value); } }) };
    mocks.getDb.mockResolvedValue({ transaction: async (callback: (value: typeof tx) => unknown) => callback(tx) });
    if (reason === "failure") mocks.validateIssuedAttribution.mockRejectedValue(new Error("unavailable"));
    else mocks.validateIssuedAttribution.mockResolvedValue(personalOwnership);
    expect(await issueAssessmentActivity(ctx(), issue, annualOwnership)).toMatchObject({ tracking: true });
    expect(writes[0]).toMatchObject({ ...personalOwnership, userId: 7 });
    expect(writes[1]).toMatchObject({ action: "issued" });
  });
});

describe("read-only attribution executor reuse", () => {
  it("the real validator resolves on the supplied transaction without acquiring a second connection", async () => {
    const actual = await vi.importActual<typeof import("./teams/attemptAttribution")>("./teams/attemptAttribution");
    const readDb = { select: vi.fn(() => ({ from: () => ({ where: async () => [] }) })) };
    expect(await actual.validateIssuedAttribution({ userId: 7, studentEmail: null }, "oit", annualOwnership, readDb as never)).toEqual(personalOwnership);
    expect(readDb.select).toHaveBeenCalledTimes(2);
    expect(mocks.getDb).not.toHaveBeenCalled();
  });
});
