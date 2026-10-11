import { describe, expect, it, vi } from "vitest";
import { recordAbandonedCheckout } from "./abandonedCheckout";
import {
  CHECKOUT_RECOVERY_CONSENT_SOURCE,
  CHECKOUT_RECOVERY_NOTICE_VERSION,
} from "../shared/checkoutRecoveryConsent";

describe("future-cart opt-out persistence", () => {
  it.each([true, false])(
    "preserves prior opt-out=%s without inventing consent",
    async optedOut => {
      const duplicate = vi.fn().mockResolvedValue(undefined);
      const values = vi
        .fn()
        .mockReturnValue({ onDuplicateKeyUpdate: duplicate });
      const limit = vi.fn().mockResolvedValue(optedOut ? [{ id: 1 }] : []);
      const db = {
        select: vi
          .fn()
          .mockReturnValue({ from: () => ({ where: () => ({ limit }) }) }),
        insert: vi.fn().mockReturnValue({ values }),
      };
      await recordAbandonedCheckout(db, {
        stripeSessionId: "cs_test_fixture_cart",
        email: "learner@example.org",
        productKey: "oit",
        productName: "OIT Exam Pass",
        amountCents: 4900,
        currency: "cad",
        recoveryUrl: null,
        recoveryConsentAt: new Date("2020-01-01"),
        recoveryConsentSource: CHECKOUT_RECOVERY_CONSENT_SOURCE,
        recoveryConsentNoticeVersion: CHECKOUT_RECOVERY_NOTICE_VERSION,
      });
      expect(values.mock.calls[0][0]).toMatchObject({
        optOut: optedOut,
        recoveryConsentSource: CHECKOUT_RECOVERY_CONSENT_SOURCE,
      });
      // Replayed events update the recovery URL only, never opt-out or send state.
      expect(Object.keys(duplicate.mock.calls[0][0].set)).toEqual([
        "recoveryUrl",
      ]);
    }
  );
});
