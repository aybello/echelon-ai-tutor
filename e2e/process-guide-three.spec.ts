import { expect, test, type Page } from "@playwright/test";

test.use({ launchOptions: { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] } });

test.beforeEach(async ({ context, baseURL }) => {
  const origin = new URL(baseURL ?? "http://127.0.0.1:3000").origin;
  await context.route("**/*", async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() !== "GET" || url.origin !== origin) return route.abort("blockedbyclient");
    if (url.pathname.startsWith("/api/trpc/")) {
      const procedures = decodeURIComponent(url.pathname.split("/api/trpc/")[1]).split(",");
      return route.fulfill({ json: procedures.map(() => ({ result: { data: { json: null } } })) });
    }
    if (url.pathname.startsWith("/api/")) return route.fulfill({ json: {} });
    return route.continue();
  });
});

async function openClarification(page: Page) {
  await page.goto("/wastewater");
  const clarification = page.getByRole("button", { name: "Explore Secondary Clarification", exact: true });
  await expect(clarification).toBeVisible({ timeout: 8_000 });
  await clarification.click({ timeout: 8_000 });
  await expect(page.getByRole("heading", { name: "See how a secondary clarifier works" })).toBeVisible();
}

// Anchor the filename at a path boundary: the shared LazyClarifierThreeLab
// loader is a static Wastewater import, not the optional guide scene.
const guideThreeModule = /\/(?:assets\/ClarifierThreeLab-[^/]+\.js|src\/components\/ClarifierThreeLab\.tsx)(?:\?.*)?$/;

async function failGuideModelLoad(page: Page) {
  const failedModules: string[] = [];
  await page.route(guideThreeModule, async route => {
    failedModules.push(route.request().url());
    await route.abort("failed");
  });
  return failedModules;
}

for (const width of [1280, 390]) {
  test(`guide offers a rendered 3D clarifier or the explicit diagram fallback at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await openClarification(page);
    // Production modulepreload may fetch shared 3D dependencies. The user
    // contract is no mounted scene until explicit activation, not zero requests.
    await expect(page.locator("canvas")).toHaveCount(0);
    await expect(page.getByRole("region", { name: "Three-dimensional circular clarifier learning model" })).toHaveCount(0);
    await expect(page.getByText("Interactive Diagram", { exact: true })).toBeVisible();
    const toggle = page.getByRole("button", { name: "Explore in 3D", exact: true });
    await toggle.focus();
    await toggle.press("Enter");
    const model = page.getByRole("region", { name: "Three-dimensional circular clarifier learning model" });
    const renderedScene = model.locator('canvas[data-scene-ready="true"]');
    const diagramFallback = page.getByRole("status").filter({ hasText: "Continue with the interactive diagram" });
    // A plain canvas is not enough: the client must either render a frame or
    // switch clearly to the existing labelled diagram after the bounded wait.
    await expect(renderedScene.or(diagramFallback)).toBeVisible({ timeout: 20_000 });
    if (!(await renderedScene.isVisible())) {
      await expect(diagramFallback).toBeVisible();
      await expect(page.getByText("Interactive Diagram", { exact: true })).toBeVisible();
      await expect(page.locator("canvas")).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
      return;
    }
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
  await openClarification(page);
  const failedModules = await failGuideModelLoad(page);
  await page.getByRole("button", { name: "Explore in 3D", exact: true }).click();
  await expect.poll(() => failedModules.length, { timeout: 8_000 }).toBeGreaterThan(0);
  await test.info().attach("failed-guide-chunk", { body: JSON.stringify(failedModules), contentType: "application/json" });
  await expect(page.getByRole("status").filter({ hasText: "Continue with the interactive diagram" })).toBeVisible({ timeout: 8_000 });
  await expect(page.getByRole("heading", { name: "This page could not finish loading", exact: true })).toHaveCount(0);
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "3D unavailable", exact: true })).toBeDisabled();
  await expect(page.getByText("Interactive Diagram", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Next Step →", exact: true }).click();
  await expect(page.getByRole("button", { name: "Explore Nutrient Removal", exact: true })).toHaveAttribute("aria-pressed", "true");
});

test("a failed guide 3D load does not disable Equipment Lab after same-session navigation", async ({ page }) => {
  await openClarification(page);
  const failedModules = await failGuideModelLoad(page);
  await page.evaluate(() => { (window as Window & { guideRecoverySession?: string }).guideRecoverySession = "mounted-guide"; });
  await page.getByRole("button", { name: "Explore in 3D", exact: true }).click();
  await expect.poll(() => failedModules.length, { timeout: 8_000 }).toBeGreaterThan(0);
  await test.info().attach("failed-guide-chunk", { body: JSON.stringify(failedModules), contentType: "application/json" });
  await expect(page.getByRole("status").filter({ hasText: "Continue with the interactive diagram" })).toBeVisible({ timeout: 8_000 });
  await expect(page.getByText("Interactive Diagram", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "This page could not finish loading", exact: true })).toHaveCount(0);

  await page.unroute(guideThreeModule);
  await page.getByRole("button", { name: "Resources", exact: true }).click();
  await page.getByRole("link", { name: /Equipment Lab/ }).click();

  await expect(page.getByRole("heading", { name: "Inside a circular clarifier", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "3D model", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator('canvas[data-scene-ready="true"]')).toBeVisible();
  expect(await page.evaluate(() => (window as Window & { guideRecoverySession?: string }).guideRecoverySession)).toBe("mounted-guide");
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
