import { expect, test, type Page } from "@playwright/test";

// Exercise the real page with controlled payment responses. No Stripe charge,
// email, customer account or database write is made by this suite.
const pending = {
  paid: true, email: "", productKey: "oit", requiresSignIn: true,
  unlockedExamTypes: [], accessToken: null, accessExpiresAt: null,
  fulfillmentPending: true,
};
const ready = { ...pending, fulfillmentPending: false };
const unavailable = { ...pending, paid: false, productKey: "", fulfillmentPending: false };

async function mockConfirmation(page: Page, response: (attempt: number) => object | "disconnect" | Promise<object | "disconnect">) {
  let calls = 0;
  await page.route("**/api/trpc/**", async route => {
    const names = new URL(route.request().url()).pathname.split("/api/trpc/")[1].split(",");
    const results = [];
    for (const name of names) {
      const value = name === "stripe.verifySession" ? await response(++calls)
        : name === "dashboardAuth.me" ? { email: null }
        : name === "access.auditMyEntitlements" ? { isManager: false, unlockedExamTypes: [], purchasedProductKeys: [], courses: [] }
        : null;
      if (value === "disconnect") return route.abort("failed");
      results.push({ result: { data: { json: value } } });
    }
    await route.fulfill({ json: results });
  });
  await page.clock.install();
  return () => calls;
}

async function openConfirmation(page: Page) {
  await page.goto("/purchase-success?session_id=cs_test_confirmation&product=oit");
}

for (const width of [1280, 390]) {
  test(`delayed fulfillment pauses honestly and manual recheck opens the course at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    const calls = await mockConfirmation(page, n => n <= 6 ? pending : ready);
    await openConfirmation(page);
    await expect(page.getByRole("status")).toContainText("checking for your course access automatically");
    await expect(page.getByRole("button", { name: "Continue to Study Setup" })).toHaveCount(0);
    for (let n = 2; n <= 6; n++) {
      await page.clock.runFor(2100);
      await expect.poll(calls).toBe(n);
      await expect(page.getByRole("status")).toContainText(n === 6 ? "Automatic checks have paused" : "checking for your course access automatically");
    }
    await page.clock.runFor(60_000);
    expect(calls()).toBe(6);
    await expect(page.getByRole("status")).toContainText("do not need to purchase again");
    await page.getByRole("button", { name: "Check access again" }).click();
    await expect(page.getByRole("link", { name: /Sign in — OIT Practice Quiz/ })).toHaveAttribute("href", "/login/otp?next=%2Fquiz");
    await expect(page.getByRole("button", { name: "Continue to Study Setup" })).toBeVisible();
    await page.clock.runFor(20_000);
    expect(calls()).toBe(7);
  });
}

test("automatic checks stop as soon as fulfillment is recorded", async ({ page }) => {
  const calls = await mockConfirmation(page, n => n === 1 ? pending : ready);
  await openConfirmation(page);
  await expect(page.getByRole("status")).toContainText("checking for your course access automatically");
  await page.clock.runFor(2100);
  await expect(page.getByRole("button", { name: "Continue to Study Setup" })).toBeVisible();
  await page.clock.runFor(20_000);
  expect(calls()).toBe(2);
});

for (const failure of ["disconnect", "server-unavailable"] as const) {
  test(`a ${failure} after confirmed payment preserves payment status and supports retry`, async ({ page }) => {
    await mockConfirmation(page, n => n === 1 ? pending : n === 2 ? (failure === "disconnect" ? "disconnect" : unavailable) : ready);
    await openConfirmation(page);
    await expect(page.getByRole("status")).toContainText("checking for your course access automatically");
    await page.clock.runFor(2100);
    await expect(page.getByRole("status")).toContainText("Automatic checks have paused");
    await expect(page.getByRole("heading", { name: "Payment Successful!" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Continue to Study Setup" })).toHaveCount(0);
    await page.getByRole("button", { name: "Check access again" }).click();
    await expect(page.getByRole("button", { name: "Continue to Study Setup" })).toBeVisible();
  });
}

test("initial confirmation failure offers recheck without sending a charged customer back to buy", async ({ page }) => {
  await mockConfirmation(page, n => n === 1 ? unavailable : ready);
  await openConfirmation(page);
  await expect(page.getByText("If Stripe charged your card, do not purchase again.", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: "Return to Pricing" })).toHaveCount(0);
  await page.getByRole("button", { name: "Check access again" }).click();
  await expect(page.getByRole("button", { name: "Continue to Study Setup" })).toBeVisible();
});

test("slow confirmation requests cannot overlap or exhaust retries in the background", async ({ page }) => {
  let release!: (value: object) => void;
  const slow = new Promise<object>(resolve => { release = resolve; });
  const calls = await mockConfirmation(page, n => n === 1 ? pending : slow);
  await openConfirmation(page);
  await expect(page.getByRole("status")).toContainText("checking for your course access automatically");
  await page.clock.runFor(2100);
  await expect.poll(calls).toBe(2);
  await page.clock.runFor(60_000);
  expect(calls()).toBe(2);
  release(ready);
  await expect(page.getByRole("button", { name: "Continue to Study Setup" })).toBeVisible();
});
