import { beforeEach, describe, expect, it, vi } from "vitest";
import { stripeRouter } from "./routers/stripeRouter";
import type { TrpcContext } from "./_core/context";
import { ALL_PRODUCTS } from "../shared/products";

const mocks = vi.hoisted(() => ({ create: vi.fn(), getDb: vi.fn(), availability: vi.fn(), track: vi.fn(), paymentSchemaReady: vi.fn() }));
vi.mock("./stripe/stripe", () => ({ stripe: { checkout: { sessions: { create: mocks.create } } } }));
vi.mock("./db", () => ({ getDb: mocks.getDb }));
vi.mock("./commercialAvailability", () => ({ getCommercialAvailability: mocks.availability, ORGANIZATION_COMMERCE_ENABLED: true }));
vi.mock("./stripe/paymentSchemaReadiness", () => ({ assertIndividualPaymentSchemaReady: mocks.paymentSchemaReady }));
vi.mock("./analytics", () => ({ trackEvent: mocks.track, hashAnalyticsAnonymousId: vi.fn() }));
vi.mock("./_core/notification", () => ({ notifyOwner: vi.fn() }));
vi.mock("./_core/env", () => ({ ENV: {
  appBaseUrl: "https://funnel.example.test", isProduction: false, cookieSecret: "synthetic-funnel-secret",
} }));

function caller(referrer?: string) {
  return stripeRouter.createCaller({
    user: null, studentEmail: null,
    req: { headers: { referer: referrer, origin: "https://untrusted-origin.example.test" }, protocol: "https" },
    res: {},
  } as TrpcContext);
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.create.mockResolvedValue({ url: "https://checkout.example.test/synthetic-session" });
  mocks.getDb.mockResolvedValue({});
  mocks.availability.mockResolvedValue(ALL_PRODUCTS.map(product => ({ key: product.key, questionCount: 400 })));
  mocks.paymentSchemaReady.mockResolvedValue(undefined);
  mocks.track.mockResolvedValue(undefined);
});

describe("individual checkout funnel cancellation", () => {
  it.each([
    { product: "class3-water", referrer: "https://funnel.example.test/pricing?product=oit&province=ON", province: "ON" },
    { product: "wpi-class3-water", referrer: "https://funnel.example.test/wpi-class3-water?province=AB", province: "AB" },
    { product: "wpi-class3-water", referrer: "https://outside.example.test/pricing?province=MB", province: "BC" },
    { product: "class3-water", referrer: "https://funnel.example.test/pricing?province=BC", province: "ON" },
    { product: "wpi-class3-water", referrer: "invalid referrer", province: "BC" },
  ])("keeps $product and safe $province context without accepting a caller-selected origin", async ({ product, referrer, province }) => {
    await expect(caller(referrer).createCheckoutSession({ productKey: product })).resolves.toEqual({ url: "https://checkout.example.test/synthetic-session" });
    const canonical = ALL_PRODUCTS.find(item => item.key === product)!;
    expect(mocks.create).toHaveBeenCalledTimes(1);
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({
      cancel_url: `https://funnel.example.test/pricing?product=${product}&province=${province}`,
      success_url: "https://funnel.example.test/purchase-success?session_id={CHECKOUT_SESSION_ID}",
      line_items: [expect.objectContaining({ price_data: expect.objectContaining({ currency: "cad", unit_amount: canonical.priceCAD }) })],
      metadata: expect.objectContaining({ product_key: product, individual_access_policy: "individual-exam-pass-12-month-v1" }),
    }));
  });

  it("fails closed for an unavailable requested product before creating any checkout", async () => {
    mocks.availability.mockResolvedValue([{ key: "oit", questionCount: 400 }]);
    await expect(caller().createCheckoutSession({ productKey: "wpi-class3-water" })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    expect(mocks.create).not.toHaveBeenCalled();
  });
});
