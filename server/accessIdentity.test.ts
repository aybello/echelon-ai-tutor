import { beforeEach, describe, expect, it, vi } from "vitest";
import { stripeRouter } from "./routers/stripeRouter";
import { resolveAccess, resolveAccessByEmail } from "./_core/access";
import { verifyAccessTokenAndRecheckDb } from "./_core/accessService";
import type { TrpcContext } from "./_core/context";

vi.mock("./_core/access", async importOriginal => ({
  ...await importOriginal<typeof import("./_core/access")>(),
  resolveAccess: vi.fn(), resolveAccessByEmail: vi.fn(),
}));
vi.mock("./_core/accessService", () => ({ verifyAccessTokenAndRecheckDb: vi.fn() }));
vi.mock("./db", () => ({ getDb: vi.fn() }));

describe("checkAccess identity boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(resolveAccess).mockResolvedValue({ hasAccess: false, isOwner: false } as any);
    vi.mocked(resolveAccessByEmail).mockResolvedValue({ hasAccess: true } as any);
    vi.mocked(verifyAccessTokenAndRecheckDb).mockResolvedValue({ hasAccess: false } as any);
  });
  const caller = (studentEmail: string | null = null) => stripeRouter.createCaller({
    user: null, studentEmail, req: {}, res: {},
  } as TrpcContext);

  it.each([undefined, "invalid-token", "valid-but-unentitled-token"])(
    "never looks up an arbitrary email with token %s", async accessToken => {
      expect(await caller().checkAccess({ examType: "oit", email: "other@example.com", accessToken }))
        .toEqual({ hasAccess: false, isOwner: false });
      expect(resolveAccessByEmail).not.toHaveBeenCalled();
    },
  );
  it("uses only the verified cookie identity for email access", async () => {
    expect((await caller("verified@example.com").checkAccess({ examType: "oit", email: "other@example.com" })).hasAccess).toBe(true);
    expect(resolveAccessByEmail).toHaveBeenCalledWith("verified@example.com", "oit");
  });
  it("preserves a live entitlement from a verified token", async () => {
    vi.mocked(verifyAccessTokenAndRecheckDb).mockResolvedValue({ hasAccess: true } as any);
    expect((await caller().checkAccess({ examType: "oit", accessToken: "valid" })).hasAccess).toBe(true);
    expect(resolveAccessByEmail).not.toHaveBeenCalled();
  });
  it("does not let a previous user's token override the current OTP identity", async () => {
    vi.mocked(resolveAccessByEmail).mockResolvedValue({ hasAccess: false } as any);
    vi.mocked(verifyAccessTokenAndRecheckDb).mockResolvedValue({ hasAccess: true } as any);
    expect((await caller("second@example.com").checkAccess({ examType: "oit", accessToken: "first-user-token" })).hasAccess).toBe(false);
    expect(verifyAccessTokenAndRecheckDb).not.toHaveBeenCalled();
  });
});
