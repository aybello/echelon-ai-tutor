import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The purchase funnel once appeared to lose 88 product selections down to 11
 * checkouts, which looked like buyers recoiling at the price. It was a
 * measurement defect: `product_selected` was emitted by four different user
 * intentions, three of which were browsing.
 *
 * The real buy button calls `trackProductSelection` and `createSession` on the
 * same click with no gate in between, so a genuine buy click cannot produce
 * `product_selected` without also attempting checkout. Any large gap between
 * those two counts therefore means the event is being emitted by something
 * that is not a buy button.
 *
 * These tests keep browsing and buying separate so conversion decisions are
 * made on a funnel that reflects what people actually did.
 */

const root = join(__dirname, "..");
const read = (relativePath: string) =>
  readFileSync(join(root, relativePath), "utf8");

describe("purchase funnel measures buying, not browsing", () => {
  it("reserves product_selected for the pricing page buy button", () => {
    const pricing = read("client/src/pages/Pricing.tsx");
    const emissions = pricing.match(/event: "product_selected"/g) ?? [];
    expect(emissions).toHaveLength(1);
  });

  it("keeps the buy click and the checkout call on the same path", () => {
    const pricing = read("client/src/pages/Pricing.tsx");
    const handler = pricing.slice(
      pricing.indexOf("function handleClick()"),
      pricing.indexOf("function handleClick()") + 900
    );
    // Both must fire together. If a gate is ever added between them, the
    // funnel gap stops meaning "checkout failed" and this test should be
    // revisited deliberately rather than by accident.
    expect(handler).toContain('event: "product_selected"');
    expect(handler).toContain("createSession.mutate");
  });

  it("reports the course picker as browsing", () => {
    const pricing = read("client/src/pages/Pricing.tsx");
    expect(pricing).toContain('surface: "course_picker"');
    expect(pricing).toContain('event: "course_browsed"');
  });

  it("reports home page course cards as browsing", () => {
    const landing = read("client/src/pages/Landing.tsx");
    expect(landing).toContain('event: "course_browsed"');
    expect(landing).toContain('surface: "course_card"');
    expect(landing).not.toContain('event: "product_selected"');
  });

  it("reports the WPI Start Studying link as browsing", () => {
    const wpi = read("client/src/pages/WpiLanding.tsx");
    expect(wpi).toContain('event: "course_browsed"');
    expect(wpi).toContain('surface: "study_link"');
    // "Start Studying" opens free practice. It is never a purchase.
    expect(wpi).not.toContain('event: "product_selected"');
  });

  it("accepts the browsing event server-side", () => {
    const router = read("server/routers/funnelAnalyticsRouter.ts");
    expect(router).toContain('z.literal("course_browsed")');
    expect(router).toContain("course_picker");
    expect(router).toContain("course_card");
    expect(router).toContain("study_link");
  });

  it("declares the browsing event in the analytics event union", () => {
    const analytics = read("server/analytics.ts");
    expect(analytics).toContain('| "course_browsed"');
  });

  it("shows browsing and buying as separate dashboard figures", () => {
    const admin = read("server/routers/admin.ts");
    expect(admin).toContain('courseBrowses: eventCount("course_browsed")');
    expect(admin).toContain('productSelections: eventCount("product_selected")');
  });
});
