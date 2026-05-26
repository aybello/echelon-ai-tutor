/**
 * products.audit.test.ts
 *
 * Price-change audit for shared/products.ts.
 *
 * WHY THIS TEST EXISTS:
 * shared/products.ts is the single source of truth for all product prices.
 * Both the Stripe checkout (server) and the Pricing page (client) import from it.
 * If someone accidentally changes a price, this test will catch it before it
 * reaches production and charges a customer the wrong amount.
 *
 * HOW TO UPDATE:
 * If you intentionally change a price, update the expected value below AND
 * update the corresponding Stripe Price ID in server/stripe/products.ts.
 */

import { describe, it, expect } from "vitest";
import { INDIVIDUAL_PRODUCTS, ALL_PRODUCTS } from "../shared/products";

// ── Canonical price table (CAD cents) ────────────────────────────────────────
// These are the approved prices. Any deviation will fail the test.
const EXPECTED_PRICES: Record<string, number> = {
  // Ontario — Entry level
  "oit":                     4900,
  "oit-ww":                  4900,
  // Ontario — Class 1
  "class1-water":            9900,
  "class1-ww":               9900,
  // Ontario — Class 2
  "class2-water":           14900,
  "class2-ww":              14900,
  // Ontario — Class 3
  "class3-water":           24900,
  "class3-ww":              24900,
  // Ontario — Class 4
  "class4-water":           29900,
  "class4-ww":              29900,
  // Ontario — WQA
  "wqa":                    14900,
  // WPI — Class I
  "wpi-class1-water":       14900,
  "wpi-class1-wastewater":  14900,
  "wpi-class1-water-coll":  14900,
  "wpi-class1-water-dist":  14900,
  // WPI — Class II
  "wpi-class2-water":       19900,
  "wpi-class2-wastewater":  19900,
  "wpi-class2-water-coll":  19900,
  "wpi-class2-water-dist":  19900,
  // WPI — Class III
  "wpi-class3-water":       24900,
  "wpi-class3-wastewater":  24900,
  "wpi-class3-water-coll":  24900,
  "wpi-class3-water-dist":  24900,
  // WPI — Class IV
  "wpi-class4-water":       29900,
  "wpi-class4-wastewater":  29900,
  "wpi-class4-water-coll":  29900,
  "wpi-class4-water-dist":  29900,
};

describe("shared/products.ts — price-change audit", () => {
  it("every product has a positive priceCAD in cents", () => {
    for (const product of INDIVIDUAL_PRODUCTS) {
      expect(product.priceCAD, `${product.key} priceCAD must be positive`).toBeGreaterThan(0);
      expect(product.priceCAD % 1, `${product.key} priceCAD must be a whole number (cents)`).toBe(0);
    }
  });

  it("no product is priced below CA$1.00 (100 cents)", () => {
    for (const product of INDIVIDUAL_PRODUCTS) {
      expect(product.priceCAD, `${product.key} price is suspiciously low`).toBeGreaterThanOrEqual(100);
    }
  });

  it("every product key in EXPECTED_PRICES matches the canonical price", () => {
    const productMap = new Map(INDIVIDUAL_PRODUCTS.map(p => [p.key, p]));
    for (const [key, expectedCents] of Object.entries(EXPECTED_PRICES)) {
      const product = productMap.get(key);
      expect(product, `Product key "${key}" not found in INDIVIDUAL_PRODUCTS`).toBeDefined();
      expect(
        product!.priceCAD,
        `PRICE DRIFT DETECTED: "${key}" should be ${expectedCents} cents (CA$${(expectedCents / 100).toFixed(2)}) but got ${product!.priceCAD} cents (CA$${(product!.priceCAD / 100).toFixed(2)}). Update EXPECTED_PRICES if this is intentional.`
      ).toBe(expectedCents);
    }
  });

  it("no product key is duplicated", () => {
    const keys = INDIVIDUAL_PRODUCTS.map(p => p.key);
    const uniqueKeys = new Set(keys);
    expect(keys.length, "Duplicate product keys found in INDIVIDUAL_PRODUCTS").toBe(uniqueKeys.size);
  });

  it("every product has a non-empty name, shortName, and description", () => {
    for (const product of INDIVIDUAL_PRODUCTS) {
      expect(product.name.trim(), `${product.key} name is empty`).not.toBe("");
      expect(product.shortName.trim(), `${product.key} shortName is empty`).not.toBe("");
      expect(product.description.trim(), `${product.key} description is empty`).not.toBe("");
    }
  });

  it("ALL_PRODUCTS contains all INDIVIDUAL_PRODUCTS", () => {
    const allKeys = new Set(ALL_PRODUCTS.map(p => p.key));
    for (const product of INDIVIDUAL_PRODUCTS) {
      expect(allKeys.has(product.key), `${product.key} is in INDIVIDUAL_PRODUCTS but missing from ALL_PRODUCTS`).toBe(true);
    }
  });

  it("EXPECTED_PRICES covers all products in INDIVIDUAL_PRODUCTS", () => {
    const coveredKeys = new Set(Object.keys(EXPECTED_PRICES));
    const missingKeys = INDIVIDUAL_PRODUCTS.map(p => p.key).filter(k => !coveredKeys.has(k));
    expect(
      missingKeys,
      `These products are not covered by the price audit: ${missingKeys.join(", ")}. Add them to EXPECTED_PRICES.`
    ).toHaveLength(0);
  });
});
