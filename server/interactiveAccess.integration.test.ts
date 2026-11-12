import { beforeEach, describe, expect, it, vi } from "vitest";
import { MySqlDialect } from "drizzle-orm/mysql-core";
import type { TrpcContext } from "./_core/context";
import { interactiveModes } from "./interactiveContent/schema";
import { validateInteractivePackage } from "./interactiveContent/loader";
import { issueSubscriptionToken } from "./_core/subscriptionToken";
import { interactiveRouter } from "./routers/interactiveRouter";

vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("./_core/env", async original => ({
  ...await original<typeof import("./_core/env")>(),
  ENV: { ...(await original<typeof import("./_core/env")>()).ENV, cookieSecret: "test-only-not-for-production", ownerOpenId: "" },
}));
// Production has no approved package. Validate a fully synthetic package through
// the production validator; only registration/loading is replaced.
vi.mock("./interactiveContent/loader", async original => ({
  ...await original<typeof import("./interactiveContent/loader")>(),
  loadInteractivePackage: vi.fn(),
}));
import { getDb } from "./db";
import { loadInteractivePackage } from "./interactiveContent/loader";

const examples = interactiveModes.flatMap(mode => ["preview", "paid"].map(kind => {
  const base = { id: `${kind}-${mode}`, mode, prompt: "Synthetic prompt" };
  if (mode === "rapid-swipe") return { ...base, correctAnswer: true, explanation: "Synthetic" };
  if (mode === "before-after") return { ...base, correctAnswer: "before", explanation: "Synthetic" };
  if (mode === "speed-match") return { ...base, pairs: [
    { id: "a", left: "A", right: "1" }, { id: "b", left: "B", right: "2" }, { id: "c", left: "C", right: "3" },
  ] };
  return { ...base, options: [{ id: "a", label: "A" }, { id: "b", label: "B" }], correctOptionId: "a", explanation: "Synthetic" };
}));
const fixture = { courseKey: "class1-water", status: "approved", version: "synthetic-v1", examples,
  previewIds: Object.fromEntries(interactiveModes.map(mode => [mode, `preview-${mode}`])) };
const packageFixture = validateInteractivePackage("class1-water", { approved: true, content: fixture });
const preview = examples.filter(x => x.id.startsWith("preview-")).map(x => x.id);
const all = examples.map(x => x.id);
const past = () => new Date(Date.now() - 60_000);
const future = () => new Date(Date.now() + 60_000);

type Rows = { purchase?: any[]; sub?: any[]; seats?: any[]; flex?: any[]; managers?: any[] };
// Projection-aware fake; SQL predicates normally enforced by MySQL are modeled
// explicitly for the tested fixtures. It is not a SQL execution test.
function fakeDb(rows: Rows = {}, predicateParams: unknown[][] = []) {
  const calls: string[] = [];
  const db = { select(fields: Record<string, unknown>) {
    let kind: string;
    if ("productKey" in fields) kind = "purchase";
    else if ("tier" in fields && "province" in fields) kind = "sub";
    else if ("orgProvince" in fields) kind = "seats";
    else if ("activationDeadline" in fields && "courseKey" in fields) kind = "flex";
    else if ("createdAt" in fields) kind = "managers";
    else if ("organizationId" in fields) kind = "teamFlex";
    else if ("orgId" in fields && "courseKeys" in fields) kind = "teamAnnual";
    else throw new Error(`Unexpected DB projection: ${Object.keys(fields)}`);
    calls.push(kind);
    const data = kind === "sub" ? (rows.sub ?? []).filter(x => x.currentPeriodEnd > new Date())
      : kind === "seats" ? (rows.seats ?? []).filter(x => x.orgTermEnd > new Date())
      : kind === "teamFlex" || kind === "teamAnnual" ? [] : ((rows as Record<string, any[]>)[kind] ?? []);
    const query = { where: (condition: Parameters<MySqlDialect["sqlToQuery"]>[0]) => {
      predicateParams.push(new MySqlDialect().sqlToQuery(condition).params);
      return Promise.resolve(data);
    }, innerJoin: () => query };
    return { from: () => query };
  } };
  vi.mocked(getDb).mockResolvedValue(db as never);
  return calls;
}
function caller(user: "anonymous" | "otp" | "oauth", email = "alice@example.test", both = false) {
  const ctx = {
    user: user === "oauth" ? { id: 123, email, role: "user", openId: "synthetic" } : null,
    studentEmail: user === "otp" ? email : both ? "foreign@example.test" : null,
    req: { headers: {} }, res: { setHeader: vi.fn() },
  } as unknown as TrpcContext;
  return interactiveRouter.createCaller(ctx);
}
async function check(user: "anonymous" | "otp" | "oauth", locked: boolean, token?: string, email?: string, both = false) {
  const response = await caller(user, email, both).getContent({ courseKey: "class1-water", ...(token ? { accessToken: token } : {}) });
  expect(response).toMatchObject({ available: true, locked, version: "synthetic-v1" });
  expect(response.examples.map(x => x.id)).toEqual(locked ? preview : all);
}
const purchase = (productKey = "class1-water", status = "active", accessExpiresAt: Date | null = null) => ({ productKey, status, accessExpiresAt });
const seat = (overrides: object = {}) => ({ courseKey: "class1-water", courseKeys: null, orgProvince: "ontario", orgTier: "stream-water", orgTermEnd: future(), orgStatus: "active", ...overrides });
const flex = (overrides: object = {}) => ({ courseKey: "class1-water", status: "active", activationDeadline: future(), startsAt: past(), accessEndsAt: future(), ...overrides });

beforeEach(() => {
  vi.clearAllMocks();
  if (!packageFixture) throw new Error("Synthetic interactive package failed validation");
  vi.mocked(loadInteractivePackage).mockImplementation(key => key === "class1-water"
    ? { status: "valid", package: packageFixture }
    : { status: "absent" });
  fakeDb();
});

describe("interactive.getContent with real access resolution", () => {
  it.each(["oauth", "otp"] as const)("unlocks an exact-course purchase for a verified %s identity", async user => {
    fakeDb({ purchase: [purchase()] });
    await check(user, false, undefined, "  ALICE@EXAMPLE.TEST  ");
  });
  it.each(["oauth", "otp"] as const)("keeps an entitled %s session unlocked despite an invalid token", async user => {
    fakeDb({ purchase: [purchase()] });
    await check(user, false, "invalid-stale-token");
  });
  it.each(["oauth", "otp"] as const)("does not fall back from an unentitled %s session to another person's valid token", async user => {
    const token = await issueSubscriptionToken({ email: "foreign@example.test", examTypes: ["class1-water"] });
    // First establish that this very token can unlock anonymously when the
    // lower DB returns the foreign holder's live entitlement.
    fakeDb({ purchase: [purchase()] });
    await check("anonymous", false, token);
    const params: unknown[][] = [];
    const calls = fakeDb({ purchase: [] }, params);
    await check(user, true, token, "alice@example.test", user === "oauth");
    // Exactly one entitlement read, not a second read for token fallback.
    expect(calls.filter(x => x === "purchase")).toHaveLength(1);
    expect(params[0]).toContain("alice@example.test");
    expect(params.flat()).not.toContain("foreign@example.test");
  });
  it("does not treat a different course purchase or a token for another course as access", async () => {
    fakeDb({ purchase: [purchase("class1-ww")] });
    await check("otp", true);
    const token = await issueSubscriptionToken({ email: "foreign@example.test", examTypes: ["class1-ww"] });
    const calls = fakeDb({ purchase: [purchase()] });
    await check("anonymous", true, token);
    expect(calls).toEqual([]); // covered-course check precedes DB read
  });
  it("requires a valid unexpired signed token and a current DB entitlement", async () => {
    const payload = { email: "foreign@example.test", examTypes: ["class1-water"] };
    const token = await issueSubscriptionToken(payload);
    const expired = await issueSubscriptionToken(payload, -120_000);
    const calls = fakeDb({ purchase: [purchase()] });
    await check("anonymous", true, expired);
    await check("anonymous", true, `${token.slice(0, -8)}garbage`);
    expect(calls).toEqual([]);
    fakeDb({ purchase: [purchase("class1-water", "refunded")] });
    await check("anonymous", true, token);
    fakeDb({ purchase: [purchase("class1-water", "active", past())] });
    await check("anonymous", true, token);
    fakeDb({ purchase: [purchase()] });
    await check("anonymous", false, token);
  });
  it.each(["refunded", "disputed", "revoked"])("does not unlock a %s purchase for a verified identity", async status => {
    fakeDb({ purchase: [purchase("class1-water", status)] });
    await check("otp", true);
  });
  it("denies expired or cancelled personal subscriptions while recognizing active ones", async () => {
    const sub = { tier: "class1", province: "ontario", status: "active", currentPeriodEnd: future(), orgId: null };
    fakeDb({ sub: [sub] }); await check("otp", false);
    fakeDb({ sub: [{ ...sub, status: "cancelled" }] }); await check("otp", true);
    fakeDb({ sub: [{ ...sub, currentPeriodEnd: past() }] }); await check("otp", true);
  });
  it("uses real Annual team assignment resolution, not the wider org subscription", async () => {
    const sub = { tier: "class1", province: "ontario", status: "active", currentPeriodEnd: future(), orgId: 10 };
    fakeDb({ sub: [sub], seats: [seat()] }); await check("otp", false);
    fakeDb({ sub: [sub], seats: [seat({ courseKey: "class1-ww" })] }); await check("otp", true);
    fakeDb({ sub: [sub], seats: [seat({ orgStatus: "revoked" })] }); await check("otp", true);
    fakeDb({ sub: [sub], seats: [seat({ orgTermEnd: past() })] }); await check("otp", true);
  });
  it("only unlocks active, in-window exact-course Flex passes via verified email", async () => {
    fakeDb({ flex: [flex()] }); await check("otp", false);
    for (const row of [flex({ courseKey: "class1-ww" }), flex({ status: "invited", startsAt: null, accessEndsAt: null }), flex({ status: "revoked" }), flex({ accessEndsAt: past() }), flex({ startsAt: future() })]) {
      fakeDb({ flex: [row] }); await check("otp", true);
    }
  });
});
