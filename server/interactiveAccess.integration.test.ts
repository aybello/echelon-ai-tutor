import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
import { getAllActiveCourseKeys } from "../shared/courseRegistry";
import { interactiveModes } from "./interactiveContent/schema";
import { validateInteractivePackage } from "./interactiveContent/loader";
import { issueSubscriptionToken } from "./_core/subscriptionToken";
import { interactiveRouter } from "./routers/interactiveRouter";

vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("./_core/env", async original => ({
  ...await original<typeof import("./_core/env")>(),
  ENV: { ...(await original<typeof import("./_core/env")>()).ENV, cookieSecret: "test-only-not-for-production", ownerOpenId: "" },
}));
// Real route validation; only the content engine and DB are synthetic.
vi.mock("./interactiveContent/engine/loader", () => ({ getInteractiveContentEngine: vi.fn() }));
import { getDb } from "./db";
import { getInteractiveContentEngine, type InteractiveContentEngine } from "./interactiveContent/engine/loader";

const examples = interactiveModes.flatMap(mode => ["preview", "paid"].map(kind => {
  const base = { id: `${kind}-${mode}`, mode, prompt: "Synthetic prompt" };
  if (mode === "rapid-swipe") return { ...base, correctAnswer: true, explanation: "Synthetic" };
  if (mode === "before-after") return { ...base, correctAnswer: "before", explanation: "Synthetic" };
  if (mode === "speed-match") return { ...base, pairs: [
    { id: "a", left: "A", right: "1" }, { id: "b", left: "B", right: "2" }, { id: "c", left: "C", right: "3" },
  ] };
  return { ...base, options: [{ id: "a", label: "A" }, { id: "b", label: "B" }], correctOptionId: "a", explanation: "Synthetic" };
}));
const packageFixture = validateInteractivePackage("class1-water", { approved: true, content: {
  courseKey: "class1-water", status: "approved", version: "synthetic-v1", examples,
  previewIds: Object.fromEntries(interactiveModes.map(mode => [mode, `preview-${mode}`])),
} });
const sessionEngine = {
  getLegacyContent: vi.fn((courseKey: string, hasAccess: boolean) => ({
    courseKey, available: true, locked: !hasAccess, version: packageFixture!.version,
    examples: packageFixture!.examples.filter(example => hasAccess || example.id.startsWith("preview-")),
  })),
  getCatalog: vi.fn((courseKey: string, hasAccess: boolean) => ({
    courseKey, available: true, locked: !hasAccess, version: packageFixture!.version,
    modes: interactiveModes.map(mode => ({ mode, totalCount: 2,
      topics: [{ id: "synthetic-topic", label: "Synthetic topic", count: 2 }],
      difficulties: [{ id: "unclassified", count: 2 }],
    })),
  })),
  startSession: vi.fn((input: { courseKey: string; mode: typeof interactiveModes[number]; sessionSize: number }, hasAccess: boolean) => {
    const selected = packageFixture!.examples.filter(example => example.mode === input.mode && (hasAccess || example.id.startsWith("preview-")));
    return { courseKey: input.courseKey, available: true, locked: !hasAccess, version: packageFixture!.version,
      sessionId: "synthetic-session", mode: input.mode, totalAvailableCount: selected.length, examples: selected.slice(0, input.sessionSize),
      filters: { topicId: null, difficulty: null, requestedSize: input.sessionSize } };
  }),
};
const past = () => new Date(Date.now() - 60_000);
const future = () => new Date(Date.now() + 60_000);
type Rows = { purchase?: object[]; sub?: object[]; seats?: object[]; flex?: object[] };
// Seed varied entitlement states, but fail immediately if games ever inspect them.
function fakeDb(rows: Rows = {}) {
  const select = vi.fn((fields: Record<string, unknown>) => {
    const kind = "productKey" in fields ? "purchase" : "tier" in fields ? "sub"
      : "orgProvince" in fields ? "seats" : "flex";
    throw new Error(`Games must not query ${kind} entitlements (${(rows[kind as keyof Rows] ?? []).length} fixture rows)`);
  });
  vi.mocked(getDb).mockResolvedValue({ select } as never);
  return select;
}
type Identity = "anonymous" | "otp" | "oauth" | "admin";
function caller(identity: Identity, email = "alice@example.test", both = false) {
  const setHeader = vi.fn();
  const ctx = {
    user: identity === "oauth" || identity === "admin" ? { id: 123, email, role: identity === "admin" ? "admin" : "user", openId: "synthetic" } : null,
    studentEmail: identity === "otp" ? email : both ? "foreign@example.test" : null,
    req: { headers: {} }, res: { setHeader },
  } as unknown as TrpcContext;
  return { api: interactiveRouter.createCaller(ctx), setHeader };
}
async function check(identity: Identity, token?: string, email?: string, both = false, courseKey = "class1-water") {
  const { api, setHeader } = caller(identity, email, both);
  const input = { courseKey, ...(token ? { accessToken: token } : {}) };
  const content = await api.getContent(input);
  expect(content).toMatchObject({ courseKey, available: true, locked: false, version: "synthetic-v1" });
  expect(content.examples.map(x => x.id)).toEqual(examples.map(x => x.id));
  expect(sessionEngine.getLegacyContent).toHaveBeenLastCalledWith(courseKey, true);
  const catalog = await api.getCatalog(input);
  expect(catalog).toMatchObject({ courseKey, available: true, locked: false, version: "synthetic-v1" });
  expect(catalog.modes.map(x => [x.mode, x.totalCount])).toEqual(interactiveModes.map(mode => [mode, 2]));
  expect(sessionEngine.getCatalog).toHaveBeenLastCalledWith(courseKey, true);
  for (const mode of interactiveModes) {
    const sessionInput = { ...input, mode, sessionSize: 20 };
    const response = await api.startSession(sessionInput);
    expect(response).toMatchObject({ courseKey, available: true, locked: false, version: "synthetic-v1", mode,
      totalAvailableCount: 2, filters: { topicId: null, difficulty: null, requestedSize: 20 } });
    expect(response.examples.map(x => x.id)).toEqual(examples.filter(x => x.mode === mode).map(x => x.id));
    expect(sessionEngine.startSession).toHaveBeenLastCalledWith(sessionInput, true);
  }
  expect(setHeader).toHaveBeenCalledTimes(8);
  expect(setHeader.mock.calls.every(call => call[0] === "Cache-Control" && call[1] === "private, no-store")).toBe(true);
  expect(getDb).not.toHaveBeenCalled();
}
const purchase = (productKey = "class1-water", status = "active", accessExpiresAt: Date | null = null) => ({ productKey, status, accessExpiresAt });
const eligibleCourses = getAllActiveCourseKeys().filter(key => key !== "electrician-309a");

beforeEach(() => {
  vi.clearAllMocks();
  if (!packageFixture) throw new Error("Synthetic interactive package failed validation");
  vi.mocked(getInteractiveContentEngine).mockReturnValue(sessionEngine as unknown as InteractiveContentEngine);
  fakeDb();
});

describe("public full games without entitlement resolution", () => {
  it("covers exactly the 38 active canonical non-309A banks", () => {
    expect(eligibleCourses).toHaveLength(38);
    expect(eligibleCourses).not.toContain("electrician-309a");
  });
  it.each(eligibleCourses)("offers every mode and endpoint anonymously for %s", async courseKey => {
    await check("anonymous", undefined, undefined, false, courseKey);
  });
  it.each(["anonymous", "otp", "oauth", "admin"] as const)("offers full games to %s without a purchase", async identity => {
    await check(identity);
  });
  it.each(["otp", "oauth"] as const)("ignores entitlement state and invalid tokens for %s", async identity => {
    for (const row of [purchase(), purchase("class1-ww"), purchase("class1-water", "refunded"),
      purchase("class1-water", "disputed"), purchase("class1-water", "revoked"), purchase("class1-water", "active", past())]) {
      const select = fakeDb({ purchase: [row] });
      await check(identity, "invalid-stale-token", "  ALICE@EXAMPLE.TEST  ");
      expect(select).not.toHaveBeenCalled();
    }
  });
  it.each(["anonymous", "otp", "oauth", "admin"] as const)("does not require valid, live, or matching tokens for %s", async identity => {
    const payload = { email: "foreign@example.test", examTypes: ["class1-water"] };
    const valid = await issueSubscriptionToken(payload);
    const expired = await issueSubscriptionToken(payload, -120_000);
    const differentCourse = await issueSubscriptionToken({ ...payload, examTypes: ["class1-ww"] });
    for (const token of [valid, expired, differentCourse, "invalid-stale-token", `${valid.slice(0, -8)}garbage`]) {
      await check(identity, token, "alice@example.test", identity === "oauth");
    }
  });
  it("ignores expired or cancelled subscriptions and inactive team assignments", async () => {
    const sub = { tier: "class1", province: "ontario", status: "active", currentPeriodEnd: future(), orgId: null };
    const seat = { courseKey: "class1-water", courseKeys: null, orgProvince: "ontario", orgTier: "stream-water", orgTermEnd: future(), orgStatus: "active" };
    const flex = { courseKey: "class1-water", status: "active", activationDeadline: future(), startsAt: past(), accessEndsAt: future() };
    for (const rows of [
      { sub: [sub] }, { sub: [{ ...sub, status: "cancelled" }] }, { sub: [{ ...sub, currentPeriodEnd: past() }] },
      { sub: [{ ...sub, orgId: 10 }], seats: [seat] }, { seats: [{ ...seat, courseKey: "class1-ww" }] },
      { seats: [{ ...seat, orgStatus: "revoked" }] }, { seats: [{ ...seat, orgTermEnd: past() }] },
      { flex: [flex] }, { flex: [{ ...flex, courseKey: "class1-ww" }] },
      { flex: [{ ...flex, status: "invited", startsAt: null, accessEndsAt: null }] },
      { flex: [{ ...flex, status: "revoked" }] }, { flex: [{ ...flex, accessEndsAt: past() }] },
      { flex: [{ ...flex, startsAt: future() }] },
    ]) {
      const select = fakeDb(rows);
      await check("otp");
      expect(select).not.toHaveBeenCalled();
    }
  });
  it.each(["electrician-309a", "electrician-309a-demo", "totally-unknown-exam", "class1", "class1-wastewater"])("rejects excluded or noncanonical game course %s", async courseKey => {
    for (const identity of ["anonymous", "otp", "oauth", "admin"] as const) {
      const { api } = caller(identity);
      await expect(api.getContent({ courseKey })).rejects.toMatchObject({ code: "BAD_REQUEST" });
      await expect(api.getCatalog({ courseKey })).rejects.toMatchObject({ code: "BAD_REQUEST" });
      await expect(api.startSession({ courseKey, mode: "rapid-swipe", sessionSize: 20 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    }
    expect(getDb).not.toHaveBeenCalled();
    expect(getInteractiveContentEngine).not.toHaveBeenCalled();
  });
  it.each(["privilegedInteractiveAccess", "role", "openId", "ownerOpenId", "unknownField"])("still rejects the client-supplied unknown field %s", async field => {
    for (const identity of ["anonymous", "otp", "oauth", "admin"] as const) {
      const { api } = caller(identity);
      const input = { courseKey: "class1-water", [field]: field === "privilegedInteractiveAccess" ? true : "admin" };
      await expect(api.getContent(input as never)).rejects.toMatchObject({ code: "BAD_REQUEST" });
      await expect(api.getCatalog(input as never)).rejects.toMatchObject({ code: "BAD_REQUEST" });
      await expect(api.startSession({ ...input, mode: "rapid-swipe", sessionSize: 20 } as never)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    }
    expect(getDb).not.toHaveBeenCalled();
    expect(getInteractiveContentEngine).not.toHaveBeenCalled();
  });
});
