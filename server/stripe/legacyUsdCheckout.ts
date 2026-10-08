/**
 * Historical USD subtotal allowlist.
 *
 * Individual checkout creation is CAD-only. This file exists solely so a buyer
 * who completed a valid USD Checkout Session before the CAD-only cutover can
 * still reload the success page and restore their already-issued access.
 */
export const LEGACY_INDIVIDUAL_USD_PRICES: Readonly<Record<string, number>> = {
  "oit": 3_500,
  "oit-ww": 3_500,
  "class1-water": 6_900,
  "class2-water": 10_900,
  "class3-water": 17_900,
  "class4-water": 21_900,
  "class1-ww": 6_900,
  "class2-ww": 10_900,
  "class3-ww": 17_900,
  "class4-ww": 21_900,
  "wqa": 10_900,
  "wpi-class1-water": 10_900,
  "wpi-class2-water": 14_900,
  "wpi-class3-water": 17_900,
  "wpi-class4-water": 21_900,
  "wpi-class1-wastewater": 10_900,
  "wpi-class2-wastewater": 14_900,
  "wpi-class3-wastewater": 17_900,
  "wpi-class4-wastewater": 21_900,
  "wpi-class1-water-coll": 10_900,
  "wpi-class2-water-coll": 14_900,
  "wpi-class3-water-coll": 17_900,
  "wpi-class4-water-coll": 21_900,
  "class1-water-dist": 6_900,
  "class2-water-dist": 10_900,
  "class3-water-dist": 17_900,
  "class4-water-dist": 21_900,
  "class1-wastewater-coll": 6_900,
  "class2-wastewater-coll": 10_900,
  "class3-wastewater-coll": 17_900,
  "class4-wastewater-coll": 21_900,
  "wpi-class1-water-dist": 10_900,
  "wpi-class2-water-dist": 14_900,
  "wpi-class3-water-dist": 17_900,
  "wpi-class4-water-dist": 21_900,
};

/**
 * Products added after the CAD-only cutover. They were never offered in USD, so
 * no historical USD Checkout Session can exist for them and they must stay out
 * of the allowlist above. Naming them keeps the coverage contract exact instead
 * of loosening it.
 */
export const POST_CUTOVER_CAD_ONLY_PRODUCTS: readonly string[] = [
  "us-class1-water",
  "us-class1-water-dist",
];

export function legacyUsdSubtotalForProduct(productKey: string): number | undefined {
  return LEGACY_INDIVIDUAL_USD_PRICES[productKey];
}
