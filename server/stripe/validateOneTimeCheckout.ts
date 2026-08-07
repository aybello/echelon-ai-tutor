import Stripe from "stripe";
import { TRPCError } from "@trpc/server";
import { ALL_PRODUCTS } from "./products";
import { normalizeEmail } from "../_core/access";

export type ValidatedOneTimeCheckout = {
  sessionId: string;
  email: string;
  product: (typeof ALL_PRODUCTS)[number];
  productKey: string;
  productName: string;
  currency: "cad" | "usd";
  amountPaidCents: number;
  paymentIntentId: string | null;
  customerName: string | null;
  phone: string | null;
};

export function validateOneTimeCheckout(
  session: Stripe.Checkout.Session,
): ValidatedOneTimeCheckout {
  if (session.mode !== "payment") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "This is not a one-time purchase checkout.",
    });
  }

  if (session.payment_status !== "paid") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Payment has not completed.",
    });
  }

  const productKey = session.metadata?.product_key;
  if (!productKey) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Checkout is missing canonical product metadata.",
    });
  }

  const product = ALL_PRODUCTS.find((item) => item.key === productKey);
  if (!product) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Checkout contains an unknown product.",
    });
  }

  const currency = session.currency?.toLowerCase();
  if (currency !== "cad" && currency !== "usd") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Checkout contains an unsupported currency.",
    });
  }

  // amount_subtotal is the catalogue amount before promotion codes.
  // amount_total may be lower when a valid Stripe promotion is applied.
  const expectedSubtotal = currency === "cad" ? product.priceCAD : product.priceUSD;
  if (session.amount_subtotal !== expectedSubtotal) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Checkout amount does not match the product catalogue.",
    });
  }

  const rawEmail =
    session.customer_details?.email ??
    session.customer_email ??
    session.metadata?.customer_email;
  const email = normalizeEmail(rawEmail) || null;
  if (!email) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Checkout has no customer email." });
  }

  return {
    sessionId: session.id,
    email,
    product,
    productKey,
    productName: session.metadata?.product_name ?? product.name,
    currency,
    amountPaidCents: session.amount_total ?? 0,
    paymentIntentId:
      typeof session.payment_intent === "string" ? session.payment_intent : null,
    customerName:
      session.customer_details?.name ?? session.metadata?.customer_name ?? null,
    phone:
      session.customer_details?.phone ?? session.metadata?.customer_phone ?? null,
  };
}
