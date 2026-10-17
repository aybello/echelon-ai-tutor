import { beforeEach, describe, expect, it, vi } from "vitest";
import { SignJWT, jwtVerify } from "jose";
import type { Request, Response } from "express";

const mocks = vi.hoisted(() => ({
  invokeLLM: vi.fn(), getDb: vi.fn(), quota: vi.fn(), trackEvent: vi.fn(), access: vi.fn(),
}));
vi.mock("./env", () => ({ ENV: {
  cookieSecret: "isolated-unit-test-secret-32-characters-minimum", isProduction: false,
  appId: "test", appBaseUrl: "https://example.invalid", oAuthServerUrl: "",
} }));
vi.mock("./llm", () => ({ invokeLLM: mocks.invokeLLM }));
vi.mock("../db", () => ({ getDb: mocks.getDb }));
vi.mock("../analytics", () => ({
  hashAnalyticsEmail: (id: string) => id,
  hashAnalyticsAnonymousId: (id: string) => id,
  trackEvent: mocks.trackEvent,
}));
vi.mock("./accessService", async () => ({
  ...await vi.importActual<typeof import("./accessService")>("./accessService"),
  resolveAccessForRequest: mocks.access,
}));
vi.mock("./aiTutorPolicy", async () => ({
  ...await vi.importActual<typeof import("./aiTutorPolicy")>("./aiTutorPolicy"),
  enforceAiTutorDailyQuota: mocks.quota,
}));
import { ENV } from "./env";
import { ANONYMOUS_TUTOR_COOKIE as COOKIE, ANONYMOUS_TUTOR_TTL_SECONDS as TTL, resolveAnonymousTutorIdentity as resolve } from "./anonymousTutorIdentity";
import { appRouter } from "../routers";
import type { TrpcContext } from "./context";

const secret = ENV.cookieSecret;
const key = new TextEncoder().encode(secret);
function request(ip = "192.0.2.10", agent = "test-agent", token?: unknown) {
  return { protocol: "https", headers: {}, ip, get: () => agent,
    cookies: token === undefined ? {} : { [COOKIE]: token },
  } as unknown as Request;
}
function response() { return { cookie: vi.fn() } as unknown as Response; }
async function signed(sub: string, iat: number, exp: number, signer = key) {
  return new SignJWT({}).setProtectedHeader({ alg: "HS256" })
    .setIssuer("echelon-anonymous-tutor").setAudience("echelon-anonymous-tutor")
    .setSubject(sub).setIssuedAt(iat).setExpirationTime(exp).sign(signer);
}

beforeEach(() => {
  vi.clearAllMocks(); ENV.cookieSecret = secret;
  mocks.access.mockResolvedValue(false); mocks.quota.mockResolvedValue(undefined);
  mocks.getDb.mockResolvedValue({});
  mocks.invokeLLM.mockResolvedValue({ choices: [{ message: { content: "Mock tutor answer" } }] });
});

describe("server-issued anonymous tutor identity", () => {
  it("uses the first issued cookie ID for the FIRST quota check AND persisted analytics, then survives rotation", async () => {
    const res = response();
    const ctx = { user: null, studentEmail: null, req: request(), res } as TrpcContext;
    const input = { examType: "oit", messages: [{ role: "user" as const, content: "Explain chlorine" }],
      anonymousId: "untrusted-client-identity" };
    await appRouter.createCaller(ctx).tutor.chat(input);
    const [name, token, options] = vi.mocked(res.cookie).mock.calls[0] as unknown as [string, string, import("express").CookieOptions];
    const { payload } = await jwtVerify(token, key);
    expect(name).toBe(COOKIE);
    expect(options).toMatchObject({ secure: true, httpOnly: true, sameSite: "lax", path: "/", maxAge: TTL * 1000 });
    expect(payload.exp! - payload.iat!).toBe(TTL);
    expect(payload.sub).toMatch(/^tutor:[a-f0-9]{64}$/);
    expect(JSON.stringify(payload)).not.toContain("192.0.2.10");
    expect(JSON.stringify(payload)).not.toContain("test-agent");
    expect(mocks.quota.mock.calls[0][0]).toEqual({ userId: null, email: null, anonymousId: payload.sub });
    expect(mocks.quota.mock.calls[0][1]).toMatchObject({ limit: 3 });
    expect(mocks.trackEvent).toHaveBeenCalledWith("ai_tutor_message", expect.objectContaining({ anonymousId: payload.sub }));
    const res2 = response();
    const nextRequest = request("198.51.100.50", "changed-UA");
    nextRequest.headers.cookie = `${COOKIE}=${token}`;
    await appRouter.createCaller({ ...ctx, req: nextRequest, res: res2 }).tutor.chat(input);
    expect(mocks.quota.mock.calls[1][0].anonymousId).toBe(payload.sub);
    expect(mocks.trackEvent.mock.calls[1][1].anonymousId).toBe(payload.sub);
    expect(res2.cookie).not.toHaveBeenCalled();
  });

  it("counts the initial message and blocks the fourth rotated request with the existing limit", async () => {
    const { TRPCError } = await import("@trpc/server");
    const counts = new Map<string, number>();
    mocks.quota.mockImplementation(async ({ anonymousId }, options) => {
      if ((counts.get(anonymousId) ?? 0) >= options.limit) throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
    });
    mocks.trackEvent.mockImplementation(async (_event, { anonymousId }) => {
      counts.set(anonymousId, (counts.get(anonymousId) ?? 0) + 1);
    });
    const res = response();
    const input = { examType: "oit", messages: [{ role: "user" as const, content: "Explain dosage" }] };
    await appRouter.createCaller({ user: null, studentEmail: null, req: request(), res } as TrpcContext).tutor.chat(input);
    const token = vi.mocked(res.cookie).mock.calls[0][1];
    for (let i = 0; i < 2; i++) {
      await appRouter.createCaller({ user: null, studentEmail: null,
        req: request(`198.51.100.${i}`, `agent-${i}`, token), res: response() } as TrpcContext).tutor.chat(input);
    }
    await expect(appRouter.createCaller({ user: null, studentEmail: null,
      req: request("203.0.113.20", "another-agent", token), res: response() } as TrpcContext).tutor.chat(input))
      .rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect([...counts.values()]).toEqual([3]);
    expect(mocks.invokeLLM).toHaveBeenCalledTimes(3);
  });

  it("retains a deterministic fallback when cookies are absent or blocked, and distinguishes visitors", async () => {
    const first = await resolve(request(), response());
    expect(await resolve(request(), response())).toBe(first);
    expect(await resolve(request("198.51.100.2"), response())).not.toBe(first);
    expect(await resolve(request("192.0.2.10", "different-UA"), response())).not.toBe(first);
  });

  it("rejects tampered, expired, wrong-key, malformed, missing-claims, future and oversized cookies", async () => {
    const now = Math.floor(Date.now() / 1000);
    const attackerId = `tutor:${"a".repeat(64)}`;
    const good = await signed(attackerId, now, now + TTL);
    const tampered = good.split("."); tampered[1] = Buffer.from(JSON.stringify({ sub: attackerId })).toString("base64url");
    const invalid = [tampered.join("."), await signed(attackerId, now - TTL - 1, now - 1),
      await signed(attackerId, now, now + TTL, new TextEncoder().encode("other-test-key-which-is-not-trusted")),
      "garbage", "x".repeat(8193), {},
      await new SignJWT({ sub: attackerId }).setProtectedHeader({ alg: "HS256" }).sign(key),
      await signed(attackerId, now + 600, now + 600 + TTL),
      await signed("raw-untrusted-identity", now, now + TTL),
      await signed(attackerId, now, now + TTL + 1)];
    const fallback = await resolve(request(), response());
    for (const token of invalid) {
      const res = response();
      expect(await resolve(request(undefined, undefined, token), res)).toBe(fallback);
      expect(res.cookie).toHaveBeenCalledOnce();
    }
  });

  it("bounds network seed input and never emits raw network data", async () => {
    const res = response();
    const id = await resolve(request("a".repeat(100_000), "b".repeat(100_000)), res);
    expect(id).toMatch(/^tutor:[a-f0-9]{64}$/);
    expect(vi.mocked(res.cookie).mock.calls[0][1].length).toBeLessThan(1024);
  });

  it("fails closed without a real configured secret, without setting a cookie", async () => {
    for (const invalid of ["", "   ", "sandbox", "placeholder", "changeme"]) {
      ENV.cookieSecret = invalid; const res = response();
      await expect(resolve(request(), res)).rejects.toThrow("JWT_SECRET");
      expect(res.cookie).not.toHaveBeenCalled();
    }
  });
});
