import {
  formatPriceCAD,
  formatPriceUSD,
  getActiveIndividualProductByKey,
  getProductByKey,
} from "./products";

export interface CheckoutOffer {
  available: boolean;
  productName: string;
  priceLabel?: string;
}

/**
 * Resolves a purchase offer without importing browser or tRPC dependencies.
 * Active individual catalogue products control new checkout. Unknown legacy
 * products may use a supplied positive fallback price. Known historical
 * products, including retired bundles, always remain unavailable for sale.
 */
export function resolvePurchaseGateOffer(input: {
  productKey: string;
  productName?: string;
  price?: number;
  isUS: boolean;
}): CheckoutOffer {
  const product = getActiveIndividualProductByKey(input.productKey);
  if (product) {
    return {
      available: true,
      productName: product.name,
      priceLabel: input.isUS
        ? formatPriceUSD(product.priceUSD)
        : formatPriceCAD(product.priceCAD),
    };
  }

  const fallbackName = input.productName?.trim() || undefined;
  if (getProductByKey(input.productKey)) {
    return { available: false, productName: fallbackName ?? "this course" };
  }

  const fallbackPrice = input.price;
  if (
    !fallbackName ||
    typeof fallbackPrice !== "number" ||
    !Number.isFinite(fallbackPrice) ||
    fallbackPrice <= 0
  ) {
    return { available: false, productName: fallbackName ?? "this course" };
  }

  return {
    available: true,
    productName: fallbackName,
    priceLabel: `${input.isUS ? "US" : "CA"}$${fallbackPrice}`,
  };
}

/** Quiz Gate accepts checkout only for a current individual catalogue product. */
export function resolveQuizGateOffer(
  productKey: string | undefined,
  isUS: boolean
): CheckoutOffer {
  const product = productKey
    ? getActiveIndividualProductByKey(productKey)
    : undefined;
  if (!product) return { available: false, productName: "this course" };

  return {
    available: true,
    productName: product.name,
    priceLabel: isUS
      ? formatPriceUSD(product.priceUSD)
      : formatPriceCAD(product.priceCAD),
  };
}
