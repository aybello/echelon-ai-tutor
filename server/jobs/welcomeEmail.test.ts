import { describe, expect, it, vi } from "vitest";
import {
  deliverWelcomeEmailForPurchase,
  getWelcomeEmailMessageId,
  isWelcomeEmailHeartbeatTask,
  toWelcomeEmailScheduledResponse,
  WELCOME_EMAIL_HEARTBEAT_TASK_UID,
} from "./welcomeEmail";

const purchase = {
  id: 42,
  email: "operator@example.ca",
  customerName: "Avery Operator",
  productName: "Class 1 Water",
  productKey: "class1-water",
};

describe("welcome email delivery", () => {
  it("uses a stable per-purchase Message-ID for platform retries", () => {
    expect(getWelcomeEmailMessageId(42)).toBe("<welcome-purchase-42@echeloninstitute.ca>");
    expect(getWelcomeEmailMessageId(42)).toBe(getWelcomeEmailMessageId(42));
  });

  it("accepts only the configured project-owned Heartbeat task", () => {
    expect(isWelcomeEmailHeartbeatTask(WELCOME_EMAIL_HEARTBEAT_TASK_UID)).toBe(true);
    expect(isWelcomeEmailHeartbeatTask("another-task")).toBe(false);
    expect(isWelcomeEmailHeartbeatTask(undefined)).toBe(false);
  });

  it("marks a purchase as sent only after SMTP accepts the welcome email", async () => {
    const events: string[] = [];
    const sendWelcomeOnboardingEmail = vi.fn(async () => {
      events.push("send");
    });
    const markSent = vi.fn(async () => {
      events.push("mark");
    });

    await deliverWelcomeEmailForPurchase(purchase as any, { sendWelcomeOnboardingEmail, markSent }, new Date("2026-08-17T12:00:00Z"));

    expect(events).toEqual(["send", "mark"]);
    expect(sendWelcomeOnboardingEmail).toHaveBeenCalledWith(expect.objectContaining({
      email: purchase.email,
      messageId: "<welcome-purchase-42@echeloninstitute.ca>",
    }));
    expect(markSent).toHaveBeenCalledWith(42, new Date("2026-08-17T12:00:00Z"));
  });

  it("does not mark a purchase as sent when SMTP rejects the email", async () => {
    const markSent = vi.fn();
    await expect(
      deliverWelcomeEmailForPurchase(purchase as any, {
        sendWelcomeOnboardingEmail: vi.fn().mockRejectedValue(new Error("SMTP unavailable")),
        markSent,
      }),
    ).rejects.toThrow("SMTP unavailable");
    expect(markSent).not.toHaveBeenCalled();
  });

  it("returns a retryable scheduled response whenever a delivery error remains", () => {
    expect(toWelcomeEmailScheduledResponse({ sent: 1, skipped: 0, errors: [] }).status).toBe(200);
    expect(toWelcomeEmailScheduledResponse({ sent: 1, skipped: 0, errors: ["SMTP unavailable"] }).status).toBe(500);
  });
});
