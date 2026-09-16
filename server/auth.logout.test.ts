import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { ECHELON_SESSION_COOKIE } from "./_core/emailSession";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

type CookieCall = {
  name: string;
  options: Record<string, unknown>;
};

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext; clearedCookies: CookieCall[] } {
  const clearedCookies: CookieCall[] = [];

  const user: AuthenticatedUser = {
    id: 1,
    openId: "sample-user",
    email: "sample@example.com",
    name: "Sample User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    phone: null,
    province: null,
  };

  const ctx: TrpcContext = {
    user,
    studentEmail: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, clearedCookies };
}

describe("auth.logout", () => {
  it.each(["auth", "dashboardAuth"] as const)("%s clears both identities even when both are present", async (route) => {
    const { ctx, clearedCookies } = createAuthContext();
    ctx.studentEmail = "otp@example.com";
    const caller = appRouter.createCaller(ctx);

    const result = await caller[route].logout();

    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(2);
    expect(clearedCookies.map(c => c.name)).toEqual([COOKIE_NAME, ECHELON_SESSION_COOKIE]);
    expect(clearedCookies[0]?.options).toMatchObject({
      secure: true,
      sameSite: "lax",
      httpOnly: true,
      path: "/",
    });
  });
});
