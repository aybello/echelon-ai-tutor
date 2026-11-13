import { expect, test, type Page } from "@playwright/test";

// Navigation-only fixtures: no auth, checkout, analytics or database writes.
test.beforeEach(async ({ page, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  await page.route("**/*", async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin !== origin) return route.abort();
    if (url.pathname.startsWith("/api/trpc/")) {
      const names = decodeURIComponent(url.pathname.split("/api/trpc/")[1]).split(",");
      const results = names.map(name => {
        const data = name === "training.managerSummary" ? { operators: [] }
          : name === "stripe.getCommercialAvailability" ? { products: [] }
          : name === "stripe.getMySubscriptionsForEmailSession" ? { subscriptions: [] }
          : null;
        return { result: { data: { json: data } } };
      });
      return route.fulfill({
        contentType: "application/json",
        body: JSON.stringify(url.searchParams.has("batch") ? results : results[0]),
      });
    }
    if (url.pathname.startsWith("/api/") || request.method() !== "GET") {
      return route.fulfill({ contentType: "application/json", body: "{}" });
    }
    return route.continue();
  });
});

async function expectNoIndividualPricing(page: Page) {
  // Deliberately inspect the whole body, not only the inner page's main.
  // Count hidden links too, so CSS cannot conceal a desktop/mobile leak.
  await expect(page.locator('body a[href^="/pricing"]')).toHaveCount(0);
  await expect(page.locator(".echelon-site-header").getByRole("link", { name: "Pricing", exact: true })).toHaveCount(0);
}

async function expectMenuWithoutPricing(page: Page, width: number) {
  const nav = page.getByRole("navigation", { name: "Global navigation", exact: true });
  await expect(nav.locator(".echelon-dashboard-link")).toBeVisible();
  await expect(nav.locator(".echelon-account-link")).toBeVisible();
  if (width < 1160) {
    await page.getByRole("button", { name: "Open navigation menu", exact: true }).click();
    const menu = page.locator(".echelon-mobile-menu");
    await expect(menu).toBeVisible();
    for (const name of ["Courses", "Jobs", "Blog", "About"]) {
      await expect(menu.getByRole("link", { name, exact: true })).toBeVisible();
    }
  } else {
    await expect(nav.getByRole("link", { name: "Jobs", exact: true })).toBeVisible();
    await nav.getByRole("button", { name: "Resources", exact: true }).click();
    await expect(nav.getByRole("link", { name: /Continuing education/ })).toBeVisible();
  }
  await expectNoIndividualPricing(page);
}

for (const width of [1280, 390]) {
  test(`Teams never links individual pricing, including open navigation, at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/teams?province=NS");
    await expect(page.getByRole("heading", { name: "Train your crew. Track every operator.", exact: true })).toBeVisible();
    await expectNoIndividualPricing(page);
    // Employer purchasing remains available; do not submit either checkout.
    await expect(page.getByRole("button", { name: /^Start 5-seat .* plan/ })).toBeEnabled();
    await page.getByRole("button", { name: "Build a Flex order", exact: true }).click();
    await expect(page.getByText("Build a Teams Flex order", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Proceed to secure checkout/ })).toBeVisible();
    await expectNoIndividualPricing(page);
    await page.evaluate(() => window.scrollTo(0, 0));
    await expectMenuWithoutPricing(page, width);
  });

  test(`manager training-hours navigation never links individual pricing at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/team/training-hours");
    await expect(page.getByRole("heading", { name: "Training Hours", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "← Team dashboard", exact: true })).toHaveAttribute("href", "/team");
    await expectNoIndividualPricing(page);
    await expectMenuWithoutPricing(page, width);
  });

  test(`learner pricing and account navigation retain individual pricing at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    // A manager continuation in the query must not classify /account itself
    // as an employer route: learners still use the same account surface.
    for (const path of ["/pricing", "/account?next=%2Fteam"]) {
      await page.goto(path);
      await expect(page.getByRole("navigation", { name: "Global navigation", exact: true })).toBeVisible();
      if (width < 1160) await page.getByRole("button", { name: "Open navigation menu", exact: true }).click();
      const pricing = page.locator(width < 1160 ? ".echelon-mobile-menu" : ".echelon-desktop-links").getByRole("link", { name: "Pricing", exact: true });
      await expect(pricing).toBeVisible();
      await expect(pricing).toHaveAttribute("href", "/pricing");
    }
  });
}

test("learner mobile pricing keeps Ontario, western and US course context", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [path, href] of [
    ["/formulas-water1?province=ON", "/pricing?product=class1-water&province=ON"],
    ["/formulas-wpi-class1?province=BC", "/pricing?product=wpi-class1-water&province=BC"],
    ["/formulas-us-texas-class-d-water?country=US&state=TX", "/pricing?product=us-texas-class-d-water&country=US&state=TX"],
  ]) {
    await page.goto(path);
    await page.getByRole("button", { name: "Open navigation menu", exact: true }).click();
    const pricing = page.locator(".echelon-mobile-menu").getByRole("link", { name: "Pricing", exact: true });
    await expect(pricing).toBeVisible();
    await expect(pricing).toHaveAttribute("href", href);
  }
});
