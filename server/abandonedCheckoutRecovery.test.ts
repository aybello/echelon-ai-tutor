import { describe, expect, it } from "vitest";
import { extractAbandonedCheckout } from "./abandonedCheckout";
import {
  buildAbandonedCheckoutCopy,
  formatCheckoutPrice,
} from "./abandonedCheckoutEmail";
import {
  MAX_CART_AGE_MS,
  RECOVERY_DELAY_MS,
  isDueForRecovery,
  resolveRecoveryTarget,
} from "./jobs/abandonedCheckoutRecovery";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function expiredSession(overrides: Record<string, any> = {}) {
  return {
    id: "cs_test_abc123",
    mode: "payment",
    currency: "cad",
    amount_total: 29900,
    customer_details: { email: "Operator@Example.com" },
    metadata: {
      product_key: "class4-water",
      product_name: "Class 4 Water Treatment Exam Pass",
    },
    after_expiration: {
      recovery: { url: "https://checkout.stripe.com/c/pay/recover_abc" },
    },
    ...overrides,
  };
}

describe("abandoned checkout extraction", () => {
  it("captures the buyer, the course and the link back to the same cart", () => {
    const record = extractAbandonedCheckout(expiredSession());
    expect(record).not.toBeNull();
    expect(record!.email).toBe("operator@example.com");
    expect(record!.productKey).toBe("class4-water");
    expect(record!.amountCents).toBe(29900);
    expect(record!.recoveryUrl).toBe(
      "https://checkout.stripe.com/c/pay/recover_abc"
    );
  });

  it("never duplicates the team recovery path", () => {
    expect(
      extractAbandonedCheckout(
        expiredSession({ metadata: { teamFlexOrderId: "12", product_key: "x" } })
      )
    ).toBeNull();
    expect(
      extractAbandonedCheckout(
        expiredSession({
          metadata: { type: "team_flex_extension", product_key: "x" },
        })
      )
    ).toBeNull();
  });

  it("drops sessions we cannot act on", () => {
    // No email means nobody to contact.
    expect(
      extractAbandonedCheckout(
        expiredSession({ customer_details: {}, customer_email: null, metadata: { product_key: "class4-water" } })
      )
    ).toBeNull();
    // No product means we cannot name what they were buying.
    expect(
      extractAbandonedCheckout(expiredSession({ metadata: {} }))
    ).toBeNull();
    // A test address must never be emailed as a customer.
    expect(
      extractAbandonedCheckout(
        expiredSession({ customer_details: { email: "probe@echelon.test" } })
      )
    ).toBeNull();
  });

  it("falls back through the email sources Stripe may populate", () => {
    const viaCustomerEmail = extractAbandonedCheckout(
      expiredSession({ customer_details: {}, customer_email: "a@b.com" })
    );
    expect(viaCustomerEmail!.email).toBe("a@b.com");

    const viaMetadata = extractAbandonedCheckout(
      expiredSession({
        customer_details: {},
        customer_email: null,
        metadata: { product_key: "class4-water", customer_email: "c@d.com" },
      })
    );
    expect(viaMetadata!.email).toBe("c@d.com");
  });

  it("refuses a recovery link that is not an https Stripe URL", () => {
    const record = extractAbandonedCheckout(
      expiredSession({ after_expiration: { recovery: { url: "javascript:alert(1)" } } })
    );
    expect(record!.recoveryUrl).toBeNull();
  });
});

describe("recovery timing", () => {
  const base = {
    optOut: false,
    recoveryEmailSentAt: null,
    recoveredAt: null,
  };

  it("waits before sending so a learner who simply reopened the tab is not interrupted", () => {
    const now = new Date("2026-10-10T12:00:00Z");
    expect(
      isDueForRecovery({
        ...base,
        abandonedAt: new Date(now.getTime() - 1 * HOUR),
        now,
      })
    ).toBe(false);
    expect(
      isDueForRecovery({
        ...base,
        abandonedAt: new Date(now.getTime() - RECOVERY_DELAY_MS - 1000),
        now,
      })
    ).toBe(true);
  });

  it("sends exactly one email and never a second", () => {
    const now = new Date("2026-10-10T12:00:00Z");
    expect(
      isDueForRecovery({
        ...base,
        recoveryEmailSentAt: new Date(now.getTime() - DAY),
        abandonedAt: new Date(now.getTime() - 2 * DAY),
        now,
      })
    ).toBe(false);
  });

  it("stays silent for opt-outs and recovered carts", () => {
    const now = new Date("2026-10-10T12:00:00Z");
    const abandonedAt = new Date(now.getTime() - 2 * DAY);
    expect(isDueForRecovery({ ...base, optOut: true, abandonedAt, now })).toBe(false);
    expect(
      isDueForRecovery({ ...base, recoveredAt: new Date(), abandonedAt, now })
    ).toBe(false);
  });

  it("does not surprise someone weeks later", () => {
    const now = new Date("2026-10-10T12:00:00Z");
    expect(
      isDueForRecovery({
        ...base,
        abandonedAt: new Date(now.getTime() - MAX_CART_AGE_MS - DAY),
        now,
      })
    ).toBe(false);
  });
});

describe("recovery target", () => {
  it("prefers the Stripe link that reopens the same cart", () => {
    const target = resolveRecoveryTarget({
      productKey: "class4-water",
      productName: "Class 4 Water Treatment Exam Pass",
      amountCents: 29900,
      currency: "cad",
      recoveryUrl: "https://checkout.stripe.com/c/pay/recover_abc",
    });
    expect(target.checkoutUrl).toBe("https://checkout.stripe.com/c/pay/recover_abc");
    expect(target.priceLabel).toBe("CA$299");
    expect(target.productName).toBe("Class 4 Water Treatment Exam Pass");
  });

  it("never drops the learner on a generic page when Stripe gave no link", () => {
    const target = resolveRecoveryTarget({
      productKey: "class4-water",
      productName: null,
      amountCents: 0,
      currency: "cad",
      recoveryUrl: null,
    });
    expect(target.checkoutUrl).toContain("/pricing?course=class4-water");
    expect(target.productName).not.toBe("");
  });
});

describe("recovery email copy", () => {
  it("states the price and what the learner gets, without false urgency", () => {
    const copy = buildAbandonedCheckoutCopy({
      productName: "Class 4 Water Treatment Exam Pass",
      priceLabel: "CA$299",
    });
    const body = copy.paragraphs.join(" ");
    expect(copy.subject).toContain("Class 4 Water Treatment Exam Pass");
    expect(body).toContain("CA$299");
    expect(body).toContain("12 months");
    // No fake scarcity or expiry pressure.
    expect(body.toLowerCase()).not.toContain("expires in");
    expect(body.toLowerCase()).not.toContain("last chance");
    expect(body.toLowerCase()).not.toContain("hurry");
  });

  it("keeps prose free of em dashes", () => {
    const copy = buildAbandonedCheckoutCopy({
      productName: "Class 4 Water Treatment Exam Pass",
      priceLabel: "CA$299",
    });
    for (const p of [...copy.paragraphs, copy.subject, copy.cta]) {
      expect(p).not.toContain("—");
    }
  });

  it("formats whole and fractional prices the way checkout showed them", () => {
    expect(formatCheckoutPrice(29900, "cad")).toBe("CA$299");
    expect(formatCheckoutPrice(6950, "cad")).toBe("CA$69.50");
    expect(formatCheckoutPrice(9900, "usd")).toBe("US$99");
  });
});
