import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  resolvePurchaseGateOffer,
  resolveQuizGateOffer,
} from "../shared/checkoutOffer";
import { mockSpecification } from "../server/mockExamSession";
import { formatQuestionBankCount } from "../shared/questionBankDisplay";
import { getProductByKey } from "../shared/products";

describe("Class 3 Water Distribution offer", () => {
  it("uses the authoritative catalogue price and avoids a stale count in its catalogue description", () => {
    const product = getProductByKey("class3-water-dist");

    expect(product).toMatchObject({
      name: "Class 3 Water Distribution Practice Pass",
      priceCAD: 24_900,
      priceUSD: 17_900,
    });
    expect(product?.description).not.toMatch(/\b500\b|\b571\b/);
  });

  it("formats the live bank metadata count and avoids a false zero while metadata is unavailable", () => {
    expect(formatQuestionBankCount(571)).toBe("571 questions");
    expect(formatQuestionBankCount("572")).toBe("572 questions");
    expect(formatQuestionBankCount(undefined)).toBe("Full question bank");
    expect(formatQuestionBankCount(0)).toBe("Full question bank");
  });

  it("matches the Class 3 mock screen's three-hour claim to the server-issued session", () => {
    expect(mockSpecification("class3-water-dist")).toMatchObject({
      bankKey: "class3-water-dist",
      count: 100,
      duration: 10_800,
    });
  });

  it("uses the catalogue offer regardless of conflicting legacy props in either currency", () => {
    expect(
      resolvePurchaseGateOffer({
        productKey: "class3-water-dist",
        productName: "Wrong legacy name",
        price: 99,
        isUS: false,
      })
    ).toEqual({
      available: true,
      productName: "Class 3 Water Distribution Practice Pass",
      priceLabel: "CA$249",
    });

    expect(
      resolvePurchaseGateOffer({
        productKey: "class3-water-dist",
        productName: "Wrong legacy name",
        price: 99,
        isUS: true,
      })
    ).toEqual({
      available: true,
      productName: "Class 3 Water Distribution Practice Pass",
      priceLabel: "US$179",
    });
  });

  it("preserves explicit legacy-offer fallbacks but fails closed when price data is missing", () => {
    expect(
      resolvePurchaseGateOffer({
        productKey: "legacy-course",
        productName: "Legacy course",
        price: 49,
        isUS: false,
      })
    ).toEqual({
      available: true,
      productName: "Legacy course",
      priceLabel: "CA$49",
    });

    expect(
      resolvePurchaseGateOffer({
        productKey: "legacy-course",
        productName: "Legacy course",
        isUS: false,
      })
    ).toEqual({
      available: false,
      productName: "Legacy course",
    });

    expect(
      resolvePurchaseGateOffer({
        productKey: "bundle-all-access",
        productName: "Historical bundle",
        price: 349,
        isUS: false,
      })
    ).toEqual({
      available: false,
      productName: "Historical bundle",
    });

    for (const price of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(
        resolvePurchaseGateOffer({
          productKey: "legacy-course",
          productName: "Legacy course",
          price,
          isUS: false,
        })
      ).toEqual({
        available: false,
        productName: "Legacy course",
      });
    }

    expect(
      resolvePurchaseGateOffer({
        productKey: "legacy-course",
        productName: "   ",
        price: 49,
        isUS: false,
      })
    ).toEqual({
      available: false,
      productName: "this course",
    });
  });

  it("allows Quiz Gate checkout only for a registered catalogue product", () => {
    expect(resolveQuizGateOffer("class3-water-dist", false)).toEqual({
      available: true,
      productName: "Class 3 Water Distribution Practice Pass",
      priceLabel: "CA$249",
    });
    expect(resolveQuizGateOffer("class3-water-dist", true)).toEqual({
      available: true,
      productName: "Class 3 Water Distribution Practice Pass",
      priceLabel: "US$179",
    });
    expect(resolveQuizGateOffer("retired-course", false)).toEqual({
      available: false,
      productName: "this course",
    });
    expect(resolveQuizGateOffer("bundle-all-access", false)).toEqual({
      available: false,
      productName: "this course",
    });
  });

  it("removes stale Class 3 Distribution claims from every study surface", () => {
    const source = (relativePath: string) =>
      readFileSync(resolve(process.cwd(), relativePath), "utf8");
    const quiz = source("client/src/pages/Class3WaterDistQuiz.tsx");
    const mock = source("client/src/pages/Class3WaterDistMockExam.tsx");
    const flashcards = source("client/src/pages/Class3WaterDistFlashcards.tsx");

    expect(quiz).toContain("formatQuestionBankCount(totalQuestions)");
    expect(quiz).toContain("Timed mock exam (100 questions, 3 hrs)");
    expect(quiz).not.toContain("price={99}");
    expect(quiz).not.toContain('priceLabel="CA$99"');
    expect(quiz).not.toContain("500 questions");
    expect(quiz).not.toContain("300 Ontario");
    expect(mock).toContain("formatQuestionBankCount(totalQuestions)");
    expect(mock).toContain("CLASS3_WATER_DISTRIBUTION_MOCK_DURATION_HOURS = 3");
    expect(mock).not.toContain("2-hour timer");
    expect(mock).not.toContain("POOL.length");
    expect(mock).not.toContain("price={99}");
    expect(flashcards).not.toContain("price={99}");
  });
});
