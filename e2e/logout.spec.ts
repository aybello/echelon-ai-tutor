import { expect, test, type BrowserContext } from "@playwright/test";

// Fake account reads, real logout HTTP endpoint and browser cookie/storage behavior.
// No customer account, database fixture, email or payment is used.
async function fakeAccountReads(context: BrowserContext) {
  await context.route("**/api/trpc/**", async route => {
    if (route.request().method() !== "GET") return route.continue();
    const names = new URL(route.request().url()).pathname.split("/api/trpc/")[1].split(",");
    const cookies = await context.cookies();
    const loggedIn = cookies.some(c => c.name === "echelon_dashboard_session");
    const values: Record<string, unknown> = {
      "auth.me": null,
      "dashboardAuth.me": { email: loggedIn ? "first@example.test" : null },
      "access.auditMyEntitlements": { isManager: false, unlockedExamTypes: [], purchasedProductKeys: [], courses: [] },
      "flashcard.getAllProgress": { progress: {} },
    };
    await route.fulfill({ json: names.map(name => ({ result: { data: { json: values[name] ?? null } } })) });
  });
}

test.beforeEach(async ({ context }) => {
  await context.addCookies([
    { name: "app_session_id", value: "fake-oauth-session", url: "http://127.0.0.1:3000", httpOnly: true },
    { name: "echelon_dashboard_session", value: "fake-email-session", url: "http://127.0.0.1:3000", httpOnly: true },
  ]);
  await fakeAccountReads(context);
});

test("sign out clears both cookies, cached access and other tabs before account reuse", async ({ context, page }) => {
  await page.goto("/account");
  await page.evaluate(() => {
    localStorage.setItem("echelon_access_token", "first-user-token");
    localStorage.setItem("echelon_qbank_v1_class4", "private-questions");
    localStorage.setItem("echelon_purchased_products", '["class4"]');
    localStorage.setItem("theme", "light");
    sessionStorage.setItem("echelon.mock.v1:class4:first@example.test", "private-mock");
  });
  const other = await context.newPage();
  await other.goto("/account");
  await other.evaluate(() => sessionStorage.setItem("echelon.mock.v1:other", "private-mock"));
  await expect(page.getByRole("button", { name: "Sign Out", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Sign Out", exact: true }).click();
  await expect(page.getByRole("button", { name: "Sign Out", exact: true })).toHaveCount(0);
  await expect(other.getByRole("button", { name: "Sign Out", exact: true })).toHaveCount(0);
  expect((await context.cookies()).filter(c => ["app_session_id", "echelon_dashboard_session"].includes(c.name))).toEqual([]);
  for (const tab of [page, other]) {
    expect(await tab.evaluate(() => ({ token: localStorage.getItem("echelon_access_token"), bank: localStorage.getItem("echelon_qbank_v1_class4"), drafts: Object.keys(sessionStorage).filter(k => k.startsWith("echelon.mock.")), theme: localStorage.getItem("theme") })))
      .toEqual({ token: null, bank: null, drafts: [], theme: "light" });
  }
  // A later identity starts without the first user's token or cached bank.
  await context.addCookies([{ name: "echelon_dashboard_session", value: "second-user-session", url: "http://127.0.0.1:3000", httpOnly: true }]);
  await page.reload();
  expect(await page.evaluate(() => localStorage.getItem("echelon_access_token"))).toBeNull();
});

test("failed sign out is visible and retry clears the session", async ({ page, context }) => {
  await page.goto("/account");
  let fail = true;
  await page.route("**/api/trpc/auth.logout**", route => fail ? route.abort("failed") : route.continue());
  await page.getByRole("button", { name: "Sign Out", exact: true }).click();
  await expect(page.getByText("Sign out did not complete. Check your connection and try again.")).toBeVisible();
  expect((await context.cookies()).some(c => c.name === "echelon_dashboard_session")).toBe(true);
  fail = false;
  await page.getByRole("button", { name: "Sign Out", exact: true }).click();
  await expect(page.getByRole("button", { name: "Sign Out", exact: true })).toHaveCount(0);
});
