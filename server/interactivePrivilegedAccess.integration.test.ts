import { beforeEach, describe, expect, it, vi } from "vitest";
import { SignJWT } from "jose";
import { MySqlDialect } from "drizzle-orm/mysql-core";
import type { TrpcContext } from "./_core/context";
import { interactiveModes } from "./interactiveContent/schema";
import { validateInteractivePackage } from "./interactiveContent/loader";
import { interactiveRouter } from "./routers/interactiveRouter";
import { quizRouter } from "./routers/quizRouter";
import { router } from "./_core/trpc";
import { issueSubscriptionToken } from "./_core/subscriptionToken";
import { assertAccess, hasAccessToExam, resolveAccessForRequest } from "./_core/accessService";
import { getDb } from "./db";
import { getInteractiveContentEngine, type InteractiveContentEngine } from "./interactiveContent/engine/loader";

// No real DB, network, or registered content. Access resolution, token
// verification, tRPC routers, question sampling, and receipts remain real.
vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("./_core/env", async original => ({
  ...await original<typeof import("./_core/env")>(),
  ENV: { ...(await original<typeof import("./_core/env")>()).ENV, cookieSecret: "test-only-not-for-production", ownerOpenId: "fixture-owner-openid" },
}));
vi.mock("./interactiveContent/engine/loader", () => ({ getInteractiveContentEngine: vi.fn() }));
// Attribution is downstream of access, and is deliberately not under test.
vi.mock("./teams/attemptAttribution", () => ({ resolveAttemptAttribution: vi.fn(async () => undefined), validateIssuedAttribution: vi.fn() }));

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
// Synthetic engine only: no artifact discovery or real DB connections.
const sessionEngine = {
  startSession: vi.fn((input: { courseKey: string; mode: typeof interactiveModes[number]; sessionSize: number }, hasAccess: boolean) => {
    const selected = packageFixture!.examples.filter(example => example.mode === input.mode && (hasAccess || example.id.startsWith("preview-")));
    return { courseKey: input.courseKey, available: true, locked: !hasAccess, version: packageFixture!.version,
      sessionId: "synthetic-session", mode: input.mode, totalAvailableCount: selected.length, examples: selected.slice(0, input.sessionSize),
      filters: { topicId: null, difficulty: null, requestedSize: input.sessionSize } };
  }),
};
const rows = Array.from({ length: 30 }, (_, i) => ({
  id: i + 1, bankKey: "class1-water", questionNum: i + 1, module: "Synthetic module", difficulty: "medium",
  question: `Synthetic question ${i + 1}`, options: '["a","b","c","d"]', correctIndex: 0,
  explanation: "Synthetic explanation", steps: null, tip: null, isCalc: "no", topic: null, cognitiveLevel: null,
}));
const app = router({ interactive: interactiveRouter, quiz: quizRouter });
const user = (role: "user" | "admin", openId = "ordinary-openid") => ({ id: 123, email: "alice@example.test", role, openId });
function caller(oauth: ReturnType<typeof user> | null, studentEmail: string | null = null) {
  return app.createCaller({ user: oauth, studentEmail, req: { headers: {} }, res: { setHeader: vi.fn() } } as unknown as TrpcContext);
}
const reads: string[] = [];
function fakeDb(purchaseRows: object[] = [], entitledEmail?: string) {
  const select = (fields: Record<string, unknown>) => {
    let kind: string;
    if ("questionNum" in fields) kind = "questions";
    else if ("productKey" in fields) kind = "purchases";
    else if ("tier" in fields && "province" in fields) kind = "subscriptions";
    else if ("orgProvince" in fields) kind = "seats";
    else if ("activationDeadline" in fields && "courseKey" in fields) kind = "flex";
    else if ("createdAt" in fields) kind = "managers";
    else if ("organizationId" in fields) kind = "teamFlex";
    else if ("orgId" in fields && "courseKeys" in fields) kind = "teamAnnual";
    else throw new Error(`Unexpected projection: ${Object.keys(fields)}`);
    reads.push(kind);
    const data = kind === "questions" ? rows : kind === "purchases" ? purchaseRows : [];
    const query = { where: (condition: Parameters<MySqlDialect["sqlToQuery"]>[0]) => {
      const filtered = kind === "purchases" && entitledEmail && !new MySqlDialect().sqlToQuery(condition).params.includes(entitledEmail) ? [] : data;
      return kind === "questions" ? { orderBy: async () => filtered } : Promise.resolve(filtered);
    }, innerJoin: () => query };
    return { from: () => query };
  };
  vi.mocked(getDb).mockResolvedValue({ select } as never);
}
async function expectContent(c: ReturnType<typeof caller>, locked: boolean, accessToken?: string) {
  const content = await c.interactive.startSession({ courseKey: "class1-water", mode: "rapid-swipe", sessionSize: 20, ...(accessToken ? { accessToken } : {}) });
  expect(content).toMatchObject({ available: true, locked, version: "synthetic-v1" });
  expect(content.examples.map(x => x.id)).toEqual(examples.filter(x => x.mode === "rapid-swipe" && (!locked || x.id.startsWith("preview-"))).map(x => x.id));
  expect(content).toMatchObject({ mode: "rapid-swipe", totalAvailableCount: locked ? 1 : 2, filters: { topicId: null, difficulty: null, requestedSize: 20 } });
}
async function expectQuiz(c: ReturnType<typeof caller>, locked: boolean, accessToken?: string) {
  const quiz = await c.quiz.getInteractiveQuestions({ bankKey: "class1-water", ...(accessToken ? { accessToken } : {}) });
  expect(quiz).toMatchObject({ locked, total: 30, trialLimit: 15 });
  expect(quiz.questions).toHaveLength(locked ? 15 : 30);
  expect(quiz.questions.every(q => Boolean(q.attemptToken))).toBe(true);
}
async function expectBoth(c: ReturnType<typeof caller>, locked: boolean, accessToken?: string) {
  await expectContent(c, locked, accessToken);
  await expectQuiz(c, locked, accessToken);
}
beforeEach(() => {
  vi.clearAllMocks(); reads.length = 0;
  if (!packageFixture) throw new Error("Synthetic package validation failed");
  vi.mocked(getInteractiveContentEngine).mockReturnValue(sessionEngine as unknown as InteractiveContentEngine);
  fakeDb();
});

describe("privileged OAuth access is confined to an explicit interactive opt-in", () => {
  it.each([
    ["admin", "interactive.startSession", user("admin"), expectContent],
    ["admin", "quiz.getInteractiveQuestions", user("admin"), expectQuiz],
    ["owner with non-admin role", "interactive.startSession", user("user", "fixture-owner-openid"), expectContent],
    ["owner with non-admin role", "quiz.getInteractiveQuestions", user("user", "fixture-owner-openid"), expectQuiz],
  ] as const)("unlocks %s on %s via the trusted OAuth identity", async (_label, _route, oauth, check) => {
    await check(caller(oauth), false);
    expect(reads).not.toContain("purchases");
  });
  it.each([user("admin"), user("user", "fixture-owner-openid")])("keeps the legacy question query on its ordinary entitlement path", async oauth => {
    const result = await caller(oauth).quiz.getQuestions({ bankKey: "class1-water" });
    expect(result).toMatchObject({ locked: true, total: 30, trialLimit: 15 });
    expect(result.questions).toHaveLength(15);
    expect(reads).toContain("purchases");
  });
  it.each([user("admin"), user("user", "fixture-owner-openid")])("canonicalizes an ordinary quiz bank alias before the privileged check", async oauth => {
    const result = await caller(oauth).quiz.getInteractiveQuestions({ bankKey: "class1" });
    expect(result.locked).toBe(false);
    expect(result.questions).toHaveLength(30);
  });
  it.each(["electrician-309a", "electrician-309a-demo"])("rejects %s even for privileged users", async courseKey => {
    for (const oauth of [user("admin"), user("user", "fixture-owner-openid")]) {
      const c = caller(oauth);
      await expect(c.interactive.startSession({ courseKey, mode: "rapid-swipe", sessionSize: 20 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
      await expect(c.quiz.getInteractiveQuestions({ bankKey: courseKey })).rejects.toMatchObject({ code: "FORBIDDEN" });
    }
    expect(getDb).not.toHaveBeenCalled();
    expect(getInteractiveContentEngine).not.toHaveBeenCalled();
  });
  it.each([user("admin"), user("user", "fixture-owner-openid")])("does not grant shared guards privileged access", async oauth => {
    const ctx = { user: oauth, studentEmail: null } as TrpcContext;
    await expect(resolveAccessForRequest(ctx, "class1-water")).resolves.toBe(false);
    await expect(assertAccess(ctx, "class1-water")).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it.each([user("admin"), user("user", "fixture-owner-openid")])("permits explicit opt-in only for an active canonical game course", async oauth => {
    const ctx = { user: oauth, studentEmail: null } as TrpcContext;
    await expect(resolveAccessForRequest(ctx, "class1-water", { privilegedInteractiveAccess: true })).resolves.toBe(true);
    expect(reads).toEqual([]);
    await expect(resolveAccessForRequest(ctx, "totally-unknown-exam", { privilegedInteractiveAccess: true })).resolves.toBe(false);
    await expect(resolveAccessForRequest(ctx, "class1-wastewater", { privilegedInteractiveAccess: true })).resolves.toBe(false);
  });
  it("does not elevate an ordinary OAuth user or an anonymous caller when opted in", async () => {
    await expect(resolveAccessForRequest({ user: user("user"), studentEmail: null } as TrpcContext, "class1-water", { privilegedInteractiveAccess: true })).resolves.toBe(false);
    await expect(resolveAccessForRequest({ user: null, studentEmail: null } as TrpcContext, "class1-water", { privilegedInteractiveAccess: true })).resolves.toBe(false);
    await expect(hasAccessToExam({ type: "oauth", userId: 123, email: "alice@example.test", user: user("admin") }, "class1-water")).resolves.toBe(false);
  });
  it("keeps a nonadmin nonowner OAuth user on previews with no entitlement", async () => {
    await expectBoth(caller(user("user")), true);
    expect(reads.filter(kind => kind === "purchases")).toHaveLength(2);
  });
  it("preserves purchased access for an ordinary OAuth user", async () => {
    fakeDb([{ productKey: "class1-water", status: "active", accessExpiresAt: null }], "alice@example.test");
    await expectBoth(caller(user("user")), false);
  });
  it("does not accept a client-supplied privileged opt-in", async () => {
    for (const c of [caller(null), caller(user("user"))]) {
      await expect(c.interactive.startSession({ courseKey: "class1-water", mode: "rapid-swipe", sessionSize: 20, privilegedInteractiveAccess: true, role: "admin", openId: "fixture-owner-openid" } as never)).rejects.toMatchObject({ code: "BAD_REQUEST" });
      // Quiz strips unknown fields; they cannot change either route's access.
      const input = { bankKey: "class1-water", privilegedInteractiveAccess: true, role: "admin", openId: "fixture-owner-openid" } as never;
      expect((await c.quiz.getInteractiveQuestions(input)).locked).toBe(true);
      expect((await c.quiz.getQuestions(input)).locked).toBe(true);
    }
    const admin = caller(user("admin"));
    const result = await admin.quiz.getInteractiveQuestions({ bankKey: "class1-water", privilegedInteractiveAccess: false } as never);
    expect(result.locked).toBe(false);
    expect(result.questions).toHaveLength(30);
  });
  it("rejects role and owner claims in a forged token and in a signed token without entitlement", async () => {
    const payload = { email: "spoof@example.test", examTypes: ["class1-water"], role: "admin", openId: "fixture-owner-openid" };
    const makeToken = (secret: string) => new SignJWT(payload).setProtectedHeader({ alg: "HS256" })
      .setIssuer("echelon-access").setAudience("echelon-quiz").setExpirationTime("1h")
      .sign(new TextEncoder().encode(secret));
    await expectBoth(caller(null), true, await makeToken("wrong-synthetic-secret"));
    expect(reads).toEqual(["questions"]);
    reads.length = 0;
    await expectBoth(caller(null), true, await makeToken("test-only-not-for-production"));
    expect(reads.filter(kind => kind === "purchases")).toHaveLength(2);
    const signed = await makeToken("test-only-not-for-production");
    await expect(resolveAccessForRequest({ user: null, studentEmail: null } as TrpcContext, "class1-water", { privilegedInteractiveAccess: true, accessToken: signed })).resolves.toBe(false);
  });
  it("preserves anonymous and OTP paths and never replaces a verified identity with a token", async () => {
    const token = await issueSubscriptionToken({ email: "foreign@example.test", examTypes: ["class1-water"] });
    const purchase = [{ productKey: "class1-water", status: "active", accessExpiresAt: null }];
    fakeDb(purchase, "foreign@example.test");
    await expectBoth(caller(null), false, token);
    await expectBoth(caller(null, "otp@example.test"), true, token);
    await expect(resolveAccessForRequest({ user: null, studentEmail: "otp@example.test" } as TrpcContext, "class1-water", { privilegedInteractiveAccess: true, accessToken: token })).resolves.toBe(false);
    fakeDb(purchase, "otp@example.test");
    await expectBoth(caller(null, "otp@example.test"), false, token);
    await expectBoth(caller(user("user"), "otp@example.test"), true, token);
    fakeDb();
    await expectBoth(caller(null), true, token); // token still needs a live entitlement
  });
});
