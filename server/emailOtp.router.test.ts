import { createHash } from "crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

type OtpRow = {
  id: number;
  email: string;
  codeHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  attempts: number;
  createdAt: Date;
};

const state = vi.hoisted(() => ({
  rows: [] as OtpRow[],
  nextId: 1,
  selectedId: null as number | null,
  lastInsertedHash: null as string | null,
  hasAccess: true,
  sendOtpEmail: vi.fn(),
  issueSession: vi.fn(async () => undefined),
  trackEvent: vi.fn(async () => undefined),
}));

function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

function createMockDb() {
  return {
    insert: () => ({
      values: async (values: Pick<OtpRow, "email" | "codeHash" | "expiresAt">) => {
        const id = state.nextId++;
        state.lastInsertedHash = values.codeHash;
        state.rows.push({
          id,
          ...values,
          usedAt: null,
          attempts: 0,
          createdAt: new Date(1_800_000_000_000 + id),
        });
      },
    }),
    update: () => ({
      set: (values: Partial<Pick<OtpRow, "usedAt" | "attempts">>) => ({
        where: async () => {
          if (typeof values.attempts === "number" && state.selectedId !== null) {
            const selected = state.rows.find((row) => row.id === state.selectedId);
            if (selected) selected.attempts = values.attempts;
            return;
          }

          if (values.usedAt) {
            if (state.selectedId !== null) {
              const selected = state.rows.find((row) => row.id === state.selectedId);
              if (selected) selected.usedAt = values.usedAt ?? null;
            } else {
              for (const row of state.rows) {
                if (!row.usedAt) row.usedAt = values.usedAt ?? null;
              }
            }
          }
        },
      }),
    }),
    delete: () => ({
      where: async () => {
        state.rows = state.rows.filter((row) => row.codeHash !== state.lastInsertedHash);
      },
    }),
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: () => ({
            limit: async () => {
              const [latest] = state.rows
                .filter((row) => !row.usedAt && row.expiresAt.getTime() > Date.now())
                .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime() || b.id - a.id);
              state.selectedId = latest?.id ?? null;
              return latest ? [latest] : [];
            },
          }),
        }),
      }),
    }),
  };
}

vi.mock("./db", () => ({
  getDb: vi.fn(async () => createMockDb()),
}));

vi.mock("./_core/access", () => ({
  normalizeEmail: (email: string) => email.trim().toLowerCase(),
  resolveEntitlementsByEmail: vi.fn(async (email: string) => ({
    email,
    hasAnyAccess: state.hasAccess,
    isManager: state.hasAccess,
    unlockedExamTypes: [],
    purchasedProductKeys: [],
    activeSubscriptionRows: [],
    sources: state.hasAccess ? ["org_manager"] : [],
  })),
}));

vi.mock("./email", () => ({
  sendOtpEmail: state.sendOtpEmail,
}));

vi.mock("./_core/subscriptionToken", () => ({
  issueSubscriptionToken: vi.fn(async () => "access-token"),
}));

vi.mock("./_core/emailSession", () => ({
  issueVerifiedEmailSessionCookie: state.issueSession,
}));

vi.mock("./analytics", () => ({
  trackEvent: state.trackEvent,
}));

const { emailOtpRouter } = await import("./routers/emailOtpRouter");

function makeCtx(): TrpcContext {
  return {
    user: null,
    studentEmail: null,
    req: { protocol: "https", headers: {}, cookies: {} } as TrpcContext["req"],
    res: { cookie: vi.fn(), clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

beforeEach(() => {
  state.rows = [];
  state.nextId = 1;
  state.selectedId = null;
  state.lastInsertedHash = null;
  state.hasAccess = true;
  state.sendOtpEmail.mockReset().mockResolvedValue(undefined);
  state.issueSession.mockClear();
  state.trackEvent.mockClear();
});

describe("emailOtp router delivery and resend safety", () => {
  it("does not report success until SMTP accepts the message", async () => {
    let acceptDelivery: (() => void) | undefined;
    state.sendOtpEmail.mockImplementation(() => new Promise<void>((resolve) => {
      acceptDelivery = resolve;
    }));

    const caller = emailOtpRouter.createCaller(makeCtx());
    let settled = false;
    const request = caller.requestOtp({ email: "Manager@Winnipeg.ca" })
      .finally(() => { settled = true; });

    await vi.waitFor(() => expect(state.sendOtpEmail).toHaveBeenCalledOnce());
    expect(settled).toBe(false);

    acceptDelivery?.();
    await expect(request).resolves.toEqual({ sent: true });
    expect(settled).toBe(true);
  });

  it("invalidates earlier unused codes when a new code is requested", async () => {
    const caller = emailOtpRouter.createCaller(makeCtx());

    await caller.requestOtp({ email: "manager@winnipeg.ca" });
    await caller.requestOtp({ email: "manager@winnipeg.ca" });

    expect(state.rows).toHaveLength(2);
    expect(state.rows.filter((row) => row.usedAt === null)).toHaveLength(1);
    expect(state.rows[0].usedAt).toBeInstanceOf(Date);
    expect(state.rows[1].usedAt).toBeNull();
  });

  it("removes an undelivered code and returns an actionable error", async () => {
    state.sendOtpEmail.mockRejectedValueOnce(new Error("SMTP rejected recipient"));
    const caller = emailOtpRouter.createCaller(makeCtx());

    await expect(caller.requestOtp({ email: "manager@winnipeg.ca" }))
      .rejects.toMatchObject({
        code: "INTERNAL_SERVER_ERROR",
        message: "We couldn't send your login code. Please try again in a moment.",
      });
    expect(state.rows).toHaveLength(0);
  });

  it("verifies the newest active code when multiple rows exist", async () => {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    state.rows.push(
      {
        id: 1,
        email: "manager@winnipeg.ca",
        codeHash: hashCode("111111"),
        expiresAt,
        usedAt: null,
        attempts: 0,
        createdAt: new Date("2026-08-28T16:00:00Z"),
      },
      {
        id: 2,
        email: "manager@winnipeg.ca",
        codeHash: hashCode("222222"),
        expiresAt,
        usedAt: null,
        attempts: 0,
        createdAt: new Date("2026-08-28T16:01:00Z"),
      },
    );

    const caller = emailOtpRouter.createCaller(makeCtx());
    const result = await caller.verifyOtp({ email: "manager@winnipeg.ca", code: "222222" });

    expect(result).toMatchObject({ valid: true, email: "manager@winnipeg.ca", isManager: true });
    expect(state.rows[0].usedAt).toBeNull();
    expect(state.rows[1].usedAt).toBeInstanceOf(Date);
    expect(state.issueSession).toHaveBeenCalledOnce();
  });

  it("keeps the neutral response for an email without entitlements", async () => {
    state.hasAccess = false;
    const caller = emailOtpRouter.createCaller(makeCtx());

    await expect(caller.requestOtp({ email: "unknown@example.com" })).resolves.toEqual({ sent: true });
    expect(state.sendOtpEmail).not.toHaveBeenCalled();
    expect(state.rows).toHaveLength(0);
  });
});
