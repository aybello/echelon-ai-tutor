import { expect, test } from "@playwright/test";

test.use({ launchOptions: { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] } });

async function openClarification(page: Parameters<typeof test>[0]["page"]) {
  await page.goto("/wastewater");
  await page.getByRole("button", { name: "Explore Secondary Clarification", exact: true }).click();
  await expect(page.getByRole("heading", { name: "See how a secondary clarifier works" })).toBeVisible();
}

for (const width of [1280, 390]) {
  test(`guide loads 3D on request, supports parts and releases the scene at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    const modelRequests: string[] = [];
    page.on("request", request => {
      if (/ClarifierThreeLab-[^/]+\.js/.test(request.url())) modelRequests.push(request.url());
    });
    await openClarification(page);
    await expect(page.locator("canvas")).toHaveCount(0);
    expect(modelRequests).toEqual([]);
    const toggle = page.getByRole("button", { name: "Explore in 3D", exact: true });
    await toggle.focus();
    await toggle.press("Enter");
    const model = page.getByRole("region", { name: "Three-dimensional circular clarifier learning model" });
    // Must draw a frame; the existence of an empty canvas is not sufficient.
    await expect(model.locator('canvas[data-scene-ready="true"]')).toBeVisible();
    await model.getByRole("button", { name: "Cutaway", exact: true }).click();
    await expect(model.getByRole("button", { name: "Cutaway", exact: true })).toHaveAttribute("aria-pressed", "true");
    await model.getByRole("button", { name: "Exploded", exact: true }).click();
    await expect(model.getByTestId("clarifier-part-number-feedwell")).toHaveText("01");
    await expect(model.getByTestId("clarifier-part-number-feedwell")).toBeVisible();
    await model.getByRole("button", { name: /Scraper Arms/ }).click();
    await expect(model.getByRole("heading", { name: "Scraper Arms", exact: true })).toBeVisible();
    await model.getByRole("tab", { name: "Exam connection", exact: true }).click();
    await expect(model.getByRole("tabpanel")).not.toBeEmpty();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    await page.getByRole("button", { name: "Close 3D model", exact: true }).click();
    await expect(page.locator("canvas")).toHaveCount(0);
    await page.getByRole("button", { name: "Explore in 3D", exact: true }).click();
    await expect(model.locator('canvas[data-scene-ready="true"]')).toBeVisible();
    await page.getByRole("button", { name: "Explore Biological Treatment", exact: true }).click();
    await expect(page.locator("canvas")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "See how a secondary clarifier works" })).toHaveCount(0);
  });
}

test("guide retains its labelled diagram when WebGL is unavailable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type: string, ...args: unknown[]) {
      if (/webgl/i.test(type)) return null;
      return Reflect.apply(original, this, [type, ...args]);
    } as typeof original;
  });
  await openClarification(page);
  await page.getByRole("button", { name: "Explore in 3D", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Continue with the interactive diagram" })).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(page.getByText("Interactive Diagram", { exact: true })).toBeVisible();
  await expect(page.getByText("WHAT HAPPENS HERE", { exact: true })).toBeVisible();
});

test("guide recovers from a failed 3D chunk without losing the lesson", async ({ page }) => {
  await page.route(/(?:ClarifierThreeLab-[^/]+\.js|\/src\/components\/ClarifierThreeLab\.tsx)(?:\?.*)?$/, route => route.abort());
  await openClarification(page);
  await page.getByRole("button", { name: "Explore in 3D", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Continue with the interactive diagram" })).toBeVisible();
  await expect(page.getByText("Interactive Diagram", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Next Step →", exact: true }).click();
  await expect(page.getByRole("button", { name: "Explore Nutrient Removal", exact: true })).toHaveAttribute("aria-pressed", "true");
});

test("guide respects reduced motion and survives WebGL context loss", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openClarification(page);
  await page.getByRole("button", { name: "Explore in 3D", exact: true }).click();
  const canvas = page.locator('canvas[data-scene-ready="true"]');
  await expect(canvas).toBeVisible();
  await expect(page.getByRole("button", { name: "Motion reduced", exact: true })).toBeVisible();
  await canvas.evaluate(node => {
    const extension = (node as HTMLCanvasElement).getContext("webgl2")?.getExtension("WEBGL_lose_context");
    if (!extension) throw new Error("WebGL context-loss extension required for this test");
    extension.loseContext();
  });
  await expect(page.getByRole("status").filter({ hasText: "Continue with the interactive diagram" })).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
});
