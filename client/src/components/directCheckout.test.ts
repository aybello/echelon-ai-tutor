import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const pricing = readFileSync(new URL("../pages/Pricing.tsx", import.meta.url), "utf8");
const quizGate = readFileSync(new URL("./QuizGate.tsx", import.meta.url), "utf8");
const purchaseGate = readFileSync(new URL("./PurchaseGate.tsx", import.meta.url), "utf8");
const stripeRouter = readFileSync(new URL("../../../server/routers/stripeRouter.ts", import.meta.url), "utf8");

describe("individual checkout flow", () => {
  it("opens Stripe directly from every individual purchase surface", () => {
    const pricingIndividualCheckout = pricing.slice(
      pricing.indexOf("function CheckoutButton"),
      pricing.indexOf("function SubscriptionCheckoutButton"),
    );

    for (const source of [pricingIndividualCheckout, quizGate, purchaseGate]) {
      expect(source).not.toContain('import CheckoutContactModal from "@/components/CheckoutContactModal"');
      expect(source).not.toContain("<CheckoutContactModal");
    }

    expect(pricingIndividualCheckout).toContain("createSession.mutate({\n      productKey,");
    expect(quizGate).toContain("createCheckout.mutate({");
    expect(purchaseGate).toContain("createCheckout.mutate({");
    expect(quizGate).toContain("onClick={handleCheckout}");
    expect(purchaseGate).toContain("onClick={handleCheckout}");
  });

  it("requires phone collection within Stripe without a redundant contact form", () => {
    const oneTimeCheckout = stripeRouter.slice(
      stripeRouter.indexOf("createCheckoutSession: publicProcedure"),
      stripeRouter.indexOf("verifySession: publicProcedure"),
    );

    expect(oneTimeCheckout).toContain("phone_number_collection: { enabled: true }");
    expect(oneTimeCheckout).not.toContain("customer_name:");
    expect(oneTimeCheckout).not.toContain("customer_phone:");
    expect(oneTimeCheckout).not.toContain("phone: z.string().max");
    expect(oneTimeCheckout).toContain('currency: z.literal("cad").optional().default("cad")');
    expect(oneTimeCheckout).toContain('const currency = "cad" as const;');
    expect(oneTimeCheckout).not.toContain('z.enum(["cad", "usd"])');
  });

  it("counts every payment entry as a checkout start", () => {
    const oneTimeCheckout = stripeRouter.slice(
      stripeRouter.indexOf("createCheckoutSession: publicProcedure"),
      stripeRouter.indexOf("verifySession: publicProcedure"),
    );

    expect(oneTimeCheckout).toContain('trackEvent("checkout_started", checkoutAnalytics)');
    expect(oneTimeCheckout).toContain('trackEvent("diagnostic_checkout_started", checkoutAnalytics)');
  });
});
