import { describe, expect, it } from "vitest";
import { ALL_PRODUCTS } from "../shared/products";
import {
  COMMERCIAL_RELEASE_PRODUCT_KEYS,
  MINIMUM_LIVE_QUESTION_COUNT,
  NON_COMMERCIAL_PRODUCT_KEYS,
  ORGANIZATION_COMMERCE_ENABLED,
  selectCommercialAvailability,
} from "./commercialAvailability";

describe("commercial availability", () => {
  it("allows only explicitly released products whose live bank meets the minimum inventory", () => {
    const result = selectCommercialAvailability(
      [{ key: "oit" }, { key: "oit-ww" }, { key: "wpi-class4-water-coll" }, { key: "class1-water" }],
      new Map([
        ["oit", MINIMUM_LIVE_QUESTION_COUNT],
        ["oit-ww", MINIMUM_LIVE_QUESTION_COUNT + 1],
        ["wpi-class4-wastewater-coll", 503],
        ["class1-water", 999],
      ]),
    );

    expect(result).toEqual([
      { key: "oit", questionCount: MINIMUM_LIVE_QUESTION_COUNT },
      { key: "oit-ww", questionCount: MINIMUM_LIVE_QUESTION_COUNT + 1 },
      { key: "wpi-class4-water-coll", questionCount: 503 },
      { key: "class1-water", questionCount: 999 },
    ]);
  });

  it("keeps a future 309A catalogue product out of individual checkout until a separate commercial approval", () => {
    expect(NON_COMMERCIAL_PRODUCT_KEYS).toContain("electrician-309a");
    expect(new Set<string>(COMMERCIAL_RELEASE_PRODUCT_KEYS).has("electrician-309a")).toBe(false);
    expect(COMMERCIAL_RELEASE_PRODUCT_KEYS.every((key) =>
      ALL_PRODUCTS.some((product) => product.key === key),
    )).toBe(true);
  });

  it("fails closed when a released course does not have enough learner-visible questions", () => {
    const result = selectCommercialAvailability(
      [{ key: "oit" }, { key: "oit-ww" }, { key: "wpi-class4-water-coll" }],
      new Map([["oit", MINIMUM_LIVE_QUESTION_COUNT - 1], ["wpi-class4-wastewater-coll", MINIMUM_LIVE_QUESTION_COUNT - 1]]),
    );

    expect(result).toEqual([]);
  });

  it("keeps organization checkout closed until a reviewed multi-course launch is approved", () => {
    expect(ORGANIZATION_COMMERCE_ENABLED).toBe(false);
  });
});
