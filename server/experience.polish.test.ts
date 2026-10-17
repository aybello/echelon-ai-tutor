import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const purchaseSuccessSource = readFileSync(
  resolve(__dirname, "../client/src/pages/PurchaseSuccess.tsx"),
  "utf8"
);
const stripeRouterSource = readFileSync(
  resolve(__dirname, "routers/stripeRouter.ts"),
  "utf8"
);
const studentDashboardSource = readFileSync(
  resolve(__dirname, "../client/src/pages/StudentDashboard.tsx"),
  "utf8"
);
const orgDashboardSource = readFileSync(
  resolve(__dirname, "../client/src/pages/OrgDashboard.tsx"),
  "utf8"
);

const subscriptionSuccessSource = readFileSync(
  resolve(__dirname, "../client/src/pages/SubscriptionSuccess.tsx"), "utf8"
);
describe("post-purchase continuation", () => {
  it("uses the Stripe-verified product and continues directly to activation", () => {
    expect(purchaseSuccessSource).toContain(
      "setPurchasedProductKey(data.paid ? data.productKey"
    );
    expect(purchaseSuccessSource).toContain(
      "href={`/activate/${encodeURIComponent(purchasedProductKey)}`}"
    );
    expect(purchaseSuccessSource).not.toContain("/account?next=");
  });

  it("routes an unverified subscription receipt to existing OTP without a fallback unlock", () => {
    expect(subscriptionSuccessSource).toContain('requiresSignIn ? "/login/otp" : quizPath');
    expect(subscriptionSuccessSource).toContain('if (!accessWritten || requiresSignIn) return;');
    const fallback = subscriptionSuccessSource.slice(subscriptionSuccessSource.indexOf('onSuccess:'), subscriptionSuccessSource.indexOf('// Fire the verification'));
    expect(fallback).toContain('setRequiresSignIn(true)');
    expect(fallback).not.toContain('localStorage.setItem');
  });
  it("does not promise a fresh year when an existing customer reopens a receipt", () => {
    expect(subscriptionSuccessSource).not.toMatch(/12 months from today|12 months from now/i);
    expect(subscriptionSuccessSource).toContain("current subscription term shown in your account");
  });
  it("does not create browser-side purchase authority", () => {
    expect(purchaseSuccessSource).not.toContain(
      'localStorage.setItem("echelon_trial_unlocked"'
    );
    expect(purchaseSuccessSource).not.toContain(
      'localStorage.setItem("echelon_purchased_products"'
    );
    expect(stripeRouterSource).not.toContain(
      "issueVerifiedEmailSessionCookie(ctx.res, email)"
    );
    expect(stripeRouterSource).toContain("checkoutIdentityMatches(ctx, email)");
  });
});

describe("responsive and printable dashboards", () => {
  it("collapses learner metrics and content grids for narrow screens", () => {
    expect(studentDashboardSource).toContain(".dashboard-metrics-grid");
    expect(studentDashboardSource).toContain("@media (max-width: 520px)");
    expect(studentDashboardSource).toContain(
      ".dashboard-two-column, .dashboard-two-one"
    );
  });

  it("prints only the municipal outcomes report and wraps manager actions", () => {
    expect(orgDashboardSource).toContain('className="team-outcomes-report"');
    expect(orgDashboardSource).toContain(
      "body * { visibility: hidden !important; }"
    );
    expect(orgDashboardSource).toContain(
      'window.addEventListener("afterprint", restoreTitle)'
    );
    expect(orgDashboardSource).toContain(
      "team-print-hidden flex flex-wrap gap-2"
    );
  });
});
