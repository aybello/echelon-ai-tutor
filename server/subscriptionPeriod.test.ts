import { describe, it, expect } from "vitest";
import { getSubscriptionPeriod } from "./stripe/subscriptionPeriod";

describe("getSubscriptionPeriod", () => {
  const START_UNIX = 1_700_000_000;
  const END_UNIX   = 1_702_678_400;

  it("reads period dates from subscription item (new API 2026-03-25.dahlia)", () => {
    const sub = {
      // Top-level fields absent (as in new API version)
      current_period_start: undefined,
      current_period_end: undefined,
      items: {
        data: [
          {
            current_period_start: START_UNIX,
            current_period_end:   END_UNIX,
          },
        ],
      },
    };

    const { currentPeriodStart, currentPeriodEnd } = getSubscriptionPeriod(sub);

    expect(currentPeriodStart).toEqual(new Date(START_UNIX * 1000));
    expect(currentPeriodEnd).toEqual(new Date(END_UNIX * 1000));
  });

  it("falls back to sub-level fields when items are absent (legacy API)", () => {
    const sub = {
      current_period_start: START_UNIX,
      current_period_end:   END_UNIX,
      items: { data: [] },
    };

    const { currentPeriodStart, currentPeriodEnd } = getSubscriptionPeriod(sub);

    expect(currentPeriodStart).toEqual(new Date(START_UNIX * 1000));
    expect(currentPeriodEnd).toEqual(new Date(END_UNIX * 1000));
  });

  it("prefers item-level fields over sub-level fields when both are present", () => {
    const ITEM_END = END_UNIX + 1000;
    const sub = {
      current_period_start: START_UNIX,
      current_period_end:   END_UNIX,       // stale sub-level value
      items: {
        data: [
          {
            current_period_start: START_UNIX,
            current_period_end:   ITEM_END,  // authoritative item-level value
          },
        ],
      },
    };

    const { currentPeriodEnd } = getSubscriptionPeriod(sub);
    expect(currentPeriodEnd).toEqual(new Date(ITEM_END * 1000));
  });

  it("returns null when neither source has the date", () => {
    const sub = {
      current_period_start: undefined,
      current_period_end:   undefined,
      items: { data: [] },
    };

    const { currentPeriodStart, currentPeriodEnd } = getSubscriptionPeriod(sub);
    expect(currentPeriodStart).toBeNull();
    expect(currentPeriodEnd).toBeNull();
  });

  it("handles missing items object gracefully", () => {
    const sub = {
      current_period_start: START_UNIX,
      current_period_end:   END_UNIX,
    };

    const { currentPeriodStart, currentPeriodEnd } = getSubscriptionPeriod(sub);
    expect(currentPeriodStart).toEqual(new Date(START_UNIX * 1000));
    expect(currentPeriodEnd).toEqual(new Date(END_UNIX * 1000));
  });
});
