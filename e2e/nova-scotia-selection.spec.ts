import { test, expect, type Page } from "@playwright/test";
import { ALL_PRODUCTS } from "../shared/products";

async function mockServices(page: Page) {
  await page.route("https://analytics.example.test/**", route => route.fulfill({ body: "" }));
  await page.route("**/api/trpc/**", async route => {
    const url = new URL(route.request().url());
    const paths = decodeURIComponent(url.pathname.split("/api/trpc/")[1]).split(",");
    const responses = paths.map(path => {
      let data: unknown = { success: true };
      if (["auth.me", "dashboardAuth.me"].includes(path)) data = null;
      else if (path === "stripe.getCommercialAvailability") data = { products: ALL_PRODUCTS.map(product => ({ key: product.key, questionCount: 400 })) };
      else if (["blog.listPosts", "feedback.publicReviews", "stripe.getMySubscriptions"].includes(path)) data = [];
      return { result: { data: { json: data } } };
    });
    await route.fulfill({ contentType: "application/json", body: JSON.stringify(url.searchParams.has("batch") ? responses : responses[0]) });
  });
}

test("Nova Scotia finder preserves its course through pricing, reload and Back", async ({ page }) => {
  await mockServices(page);
  await page.goto("/?province=NS#find-course");
  const finder = page.locator(".course-finder");
  await expect(finder.locator("select").nth(0)).toHaveValue("ns");
  await finder.locator("select").nth(1).selectOption("water-treatment");
  await finder.locator("select").nth(2).selectOption("wpi-class1-water");
  await expect(finder.getByRole("link", { name: "Try this course" })).toHaveAttribute("href", "/wpi-class1-water?province=NS");
  await expect(finder).toContainText("2017 ABC exams");
  await finder.getByRole("link", { name: "View access plans" }).click();
  await expect(page).toHaveURL(/product=wpi-class1-water&province=NS/);
  await expect(page.locator("#individual-course-picker")).toHaveValue("wpi-class1-water");
  await expect(page.locator('#individual-course-picker option[value="oit"]')).toHaveCount(0);
  await expect(page.locator('#individual-course-picker option[value="wpi-class4-water-dist"]')).toHaveCount(0);
  await page.reload();
  await expect(page.locator("#individual-course-picker")).toHaveValue("wpi-class1-water");
  await page.goBack();
  await expect(finder.locator("select").nth(0)).toHaveValue("ns");
  await expect(finder.locator("select").nth(2)).toHaveValue("wpi-class1-water");
  await finder.locator("select").nth(1).selectOption("water-distribution");
  await expect(finder.locator("select").nth(2)).toHaveValue("");
  await expect(finder.locator("select").nth(2).locator("option")).toHaveCount(4);
});

test("Nova Scotia banner opens the scoped finder instead of Ontario's catalogue", async ({ page }) => {
  await mockServices(page);
  await page.goto("/wpi");
  await page.locator('button[title="Nova Scotia"]').click();
  await expect(page).toHaveURL(/\?province=NS#find-course$/);
  await expect(page.locator('#find-course .course-finder select').nth(0)).toHaveValue("ns");
});

test("Nova Scotia finder fits a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockServices(page);
  await page.goto("/?province=NS#find-course");
  const finder = page.locator(".course-finder");
  await expect(finder).toBeVisible();
  await expect(finder.locator("select").nth(0)).toHaveValue("ns");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
