/**
 * Regression tests for where Command feedback and captured emails are stored.
 *
 * These previously wrote to user_feedback and trial_emails, which have no
 * guestId column and no scenarioId column — so anonymous runs lost their
 * identity, and Command rows contaminated quiz-feedback and trial-conversion
 * reporting. They must land in the purpose-built Command tables instead.
 *
 * Runs without a database: getDb is mocked so the insert target and payload can
 * be inspected directly.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";

const inserts: Array<{ table: unknown; values: Record<string, unknown> }> = [];

vi.mock("./db", () => ({
  getDb: async () => ({
    insert: (table: unknown) => ({
      values: async (values: Record<string, unknown>) => {
        inserts.push({ table, values });
      },
    }),
  }),
}));

const { appRouter } = await import("./routers");
const { commandFeedback, commandEmailCapture } = await import("../drizzle/schema");
import type { TrpcContext } from "./_core/context";

function anonymousCtx(): TrpcContext {
  return {
    user: null,
    studentEmail: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

beforeEach(() => {
  inserts.length = 0;
});

describe("Command feedback and email capture destinations", () => {
  it("writes scenario feedback to command_feedback, keeping guestId and scenarioId", async () => {
    const caller = appRouter.createCaller(anonymousCtx());

    await expect(caller.incidentCommand.submitFeedback({
      scenarioId: "cedar-ridge-storm",
      rating: 4,
      comment: "  sharp debrief  ",
      guestId: "guest-abc",
    })).resolves.toEqual({ saved: true });

    expect(inserts).toHaveLength(1);
    expect(inserts[0].table).toBe(commandFeedback);
    expect(inserts[0].values).toMatchObject({
      scenarioId: "cedar-ridge-storm",
      guestId: "guest-abc",
      rating: 4,
      comment: "sharp debrief",
      userId: null,
    });
  });

  it("writes captured emails to command_email_capture, keeping guestId", async () => {
    const caller = appRouter.createCaller(anonymousCtx());

    // Mixed case is accepted by the validator and normalised by the handler;
    // surrounding whitespace is rejected upstream by z.string().email().
    await expect(caller.incidentCommand.captureEmail({
      email: "Operator@Example.COM",
      scenarioId: "cedar-ridge-storm",
      guestId: "guest-xyz",
    })).resolves.toEqual({ captured: true });

    expect(inserts).toHaveLength(1);
    expect(inserts[0].table).toBe(commandEmailCapture);
    expect(inserts[0].values).toMatchObject({
      email: "operator@example.com",
      guestId: "guest-xyz",
      source: "command_debrief",
      userId: null,
    });
  });

  it("stores a null guestId rather than an empty string when none is supplied", async () => {
    const caller = appRouter.createCaller(anonymousCtx());

    await caller.incidentCommand.submitFeedback({
      scenarioId: "cedar-ridge-storm",
      rating: 5,
      comment: "",
      guestId: "",
    });

    expect(inserts[0].values).toMatchObject({ guestId: null, comment: null });
  });
});
