import { describe, expect, it } from "vitest";
import {
  COMMERCIAL_RELEASE_PRODUCT_KEYS,
  MINIMUM_LIVE_QUESTION_COUNT,
  ORGANIZATION_COMMERCE_ENABLED,
  selectCommercialAvailability,
} from "./commercialAvailability";

describe("commercial availability", () => {
  it("allows only explicitly released products whose live bank meets the minimum inventory", () => {
    const result = selectCommercialAvailability(
      [{ key: "oit" }, { key: "oit-ww" }, { key: "class1-water" }],
      new Map([
        ["oit", MINIMUM_LIVE_QUESTION_COUNT],
        ["oit-ww", MINIMUM_LIVE_QUESTION_COUNT + 1],
        ["class1-water", 999],
      ]),
    );

    expect(COMMERCIAL_RELEASE_PRODUCT_KEYS).toEqual(["oit", "oit-ww"]);
    expect(result).toEqual([
      { key: "oit", questionCount: MINIMUM_LIVE_QUESTION_COUNT },
      { key: "oit-ww", questionCount: MINIMUM_LIVE_QUESTION_COUNT + 1 },
    ]);
  });

  it("fails closed when a released course does not have enough learner-visible questions", () => {
    const result = selectCommercialAvailability(
      [{ key: "oit" }, { key: "oit-ww" }],
      new Map([["oit", MINIMUM_LIVE_QUESTION_COUNT - 1]]),
    );

    expect(result).toEqual([]);
  });

  it("keeps organization checkout closed until a reviewed multi-course launch is approved", () => {
    expect(ORGANIZATION_COMMERCE_ENABLED).toBe(false);
  });
});
