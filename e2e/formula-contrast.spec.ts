import { test, expect } from "@playwright/test";

// These pages are deliberately tested without a backend: their reference content
// and navigation must remain legible even when authentication requests fail.
const formulaRoutes = [
  "/formulas", "/formulas-water1", "/formulas-water2", "/formulas-water3", "/formulas-water4",
  "/formulas-ww1", "/formulas-ww2", "/formulas-ww3", "/formulas-ww4", "/formulas-wqa",
  "/formulas-us-class1", "/formulas-us-texas-class-d-water",
  "/formulas-wpi-class1", "/formulas-wpi-class2", "/formulas-wpi-class3", "/formulas-wpi-class4",
  "/formulas-wpi-class1-ww", "/formulas-wpi-class2-ww", "/formulas-wpi-class3-ww", "/formulas-wpi-class4-ww",
];

test.beforeEach(async ({ page }) => {
  await page.route("**/api/**", route => route.abort());
});

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  test(`formula headings and course navigation remain legible at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    for (const route of formulaRoutes) {
      await page.goto(route);
      const root = page.locator(".legacy-formula-page");
      await expect(root, route).toBeVisible();
      const heading = root.locator("h1").first();
      await expect(heading, route).toBeVisible();
      const inGradient = await heading.evaluate(el => !!el.closest('[style*="linear-gradient"]'));
      if (route === "/formulas") {
        await expect(heading, route).toHaveCSS("color", "rgb(0, 0, 0)");
        await expect(page.locator(".formulas-intro"), route).toHaveCSS("background-color", "rgb(255, 255, 255)");
      } else if (inGradient) {
        await expect(heading, route).toHaveCSS("color", "rgb(255, 255, 255)");
        const hero = heading.locator('xpath=ancestor::*[contains(@style, "linear-gradient")][1]');
        const paragraphs = hero.locator("p");
        for (let i = 0; i < await paragraphs.count(); i++) {
          await expect(paragraphs.nth(i), route).toHaveCSS("color", "rgb(255, 255, 255)");
          await expect(paragraphs.nth(i), route).toHaveCSS("opacity", "1");
        }
      } else {
        await expect(heading, route).toHaveCSS("color", "rgb(15, 23, 42)");
      }
      const activeTab = page.locator(viewport.width < 720 ? ".echelon-mobile-course-tab.is-active span" : ".echelon-course-tab.is-active span");
      if (await activeTab.count()) await expect(activeTab.first(), route).toHaveCSS("color", "rgb(255, 255, 255)");
    }
  });
}

test("mobile pricing and account actions keep white text on their dark backgrounds", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/formulas-water1");
  await page.locator(".echelon-menu-button").click();
  const pricing = page.locator(".echelon-mobile-pricing-link");
  await expect(pricing).toBeVisible();
  await expect(pricing).toHaveCSS("color", "rgb(255, 255, 255)");
  await expect(pricing).toHaveCSS("background-color", "rgb(23, 87, 184)");
  await expect(page.locator(".echelon-mobile-actions a").last()).toHaveCSS("color", "rgb(255, 255, 255)");
  await page.locator(".echelon-menu-button").click();
  await expect(pricing).toHaveCount(0);
});

for (const width of [390, 1440]) {
  test(`formula library search and categories work with keyboard at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/formulas");
    const search = page.getByPlaceholder("Search formulas, e.g. 'CT value', 'SVI', 'flow rate'");
    await search.focus();
    await page.keyboard.type("zz-synthetic-no-formula");
    await expect(page.getByText("No formulas found", { exact: false })).toBeVisible();
    await search.fill("");
    const category = page.getByRole("group", { name: "Formula categories" }).getByRole("button").nth(1);
    await category.focus();
    await page.keyboard.press("Enter");
    await expect(category).not.toHaveCSS("background-color", "rgb(255, 255, 255)");
    await page.getByRole("button", { name: "Expand all", exact: true }).click();
    await expect(page.getByRole("button", { name: "Collapse all", exact: true })).toBeVisible();
  });
}
