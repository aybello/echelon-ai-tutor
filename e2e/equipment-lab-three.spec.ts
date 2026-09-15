import { expect, test } from "@playwright/test";

// CI runners have no physical GPU. Use Chromium’s software renderer for the
// successful-render tests; separate cases explicitly disable/lose WebGL.
test.use({ launchOptions: { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] } });

async function awaitUsableLabMode(page: Parameters<typeof test>[0]["page"]): Promise<"three" | "diagram"> {
  const canvas = page.locator('canvas[data-scene-ready="true"]');
  const fallback = page.getByRole("status").filter({ hasText: "Diagram view is ready" });
  await expect.poll(async () => {
    if (await canvas.isVisible().catch(() => false)) return "three";
    if (await fallback.isVisible().catch(() => false)) return "diagram";
    return "pending";
  }, { timeout: 15_000 }).not.toBe("pending");
  return (await canvas.isVisible().catch(() => false)) ? "three" : "diagram";
}

test("public Equipment Lab provides either a controllable 3D clarifier or its accessible Diagram fallback", async ({ page }) => {
  await page.goto("/equipment-lab");

  await expect(page.getByRole("heading", { name: "Inside a circular clarifier", exact: true })).toBeVisible();
  const aboutModel = page.getByRole("button", { name: "About this model", exact: true });
  await expect(aboutModel).toHaveAttribute("aria-expanded", "false");
  await aboutModel.click();
  await expect(page.getByText(/generalized learning illustration, not manufacturer CAD/i)).toBeVisible();
  await expect(page.getByRole("button", { name: "3D model", exact: true })).toHaveAttribute("aria-pressed", "true");
  const mode = await awaitUsableLabMode(page);
  if (mode === "diagram") {
    await expect(page.getByRole("status").filter({ hasText: "Diagram view is ready" })).toContainText("Diagram view is ready");
    await expect(page.getByRole("button", { name: "Diagram view", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("button", { name: /Surface Skimmer/ })).toBeVisible();
    return;
  }
  await expect(page.getByRole("heading", { name: "Clarification stages", exact: true })).toBeVisible();
  await expect(page.getByText("Distribute influent", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Exploded", exact: true }).click();
  await expect(page.getByRole("button", { name: "Exploded", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator('canvas[data-scene-ready="true"]')).toBeVisible();

  const scraperButton = page.getByRole("button", { name: /Scraper Arms/ });
  await scraperButton.focus();
  await scraperButton.press("Enter");
  await expect(page.getByRole("heading", { name: "Scraper Arms", exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Water shown", exact: true }).click();
  await expect(page.getByRole("button", { name: "Water hidden", exact: true })).toHaveAttribute("aria-pressed", "false");

  await page.getByRole("button", { name: "Diagram view", exact: true }).click();
  await expect(page.getByRole("button", { name: "Diagram view", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(page.locator("svg").filter({ has: page.getByText("Clarification stages") })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Surface Skimmer/ })).toBeVisible();
});

test("public Equipment Lab honors reduced-motion preference without sign-in or learner activity", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/equipment-lab");

  if (await awaitUsableLabMode(page) === "diagram") {
    await expect(page.getByRole("status").filter({ hasText: "Diagram view is ready" })).toContainText("Diagram view is ready");
    return;
  }
  await expect(page.getByRole("button", { name: "Motion reduced", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Motion reduced", exact: true })).toHaveAttribute("aria-pressed", "true");
});

for (const viewport of [{ width: 1280, height: 800 }, { width: 390, height: 844 }]) {
  test(`Equipment Lab automatically uses the diagram without WebGL at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type: string, ...args: unknown[]) {
        if (/webgl/i.test(type)) return null;
        return Reflect.apply(original, this, [type, ...args]);
      } as typeof original;
    });
    await page.goto("/equipment-lab");
    await expect(page.getByRole("status").filter({ hasText: "Diagram view is ready" })).toContainText("Diagram view is ready");
    await expect(page.getByRole("button", { name: "Diagram view", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("canvas")).toHaveCount(0);
    await page.getByRole("button", { name: /Surface Skimmer/ }).click();
    await expect(page.getByRole("heading", { name: "Surface Skimmer", exact: true })).toBeVisible();
  });
}

test("Equipment Lab recovers when an active WebGL context is lost", async ({ page }) => {
  await page.goto("/equipment-lab");
  if (await awaitUsableLabMode(page) === "diagram") {
    await expect(page.getByRole("status").filter({ hasText: "Diagram view is ready" })).toContainText("Diagram view is ready");
    return;
  }
  const canvas = page.locator('canvas[data-scene-ready="true"]');
  await canvas.evaluate(node => {
    const gl = (node as HTMLCanvasElement).getContext("webgl2");
    const extension = gl?.getExtension("WEBGL_lose_context");
    if (!extension) throw new Error("Context loss extension unavailable in test browser");
    extension.loseContext();
  });
  await expect(page.getByRole("status").filter({ hasText: "Diagram view is ready" })).toContainText("Diagram view is ready");
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Surface Skimmer/ })).toBeVisible();
});

test("Equipment Lab recovers when its 3D module cannot load", async ({ page }) => {
  await page.route(/(?:ClarifierThreeLab-[^/]+\.js|\/src\/components\/ClarifierThreeLab\.tsx)(?:\?.*)?$/, route => route.abort());
  await page.goto("/equipment-lab");
  await expect(page.getByRole("status").filter({ hasText: "Diagram view is ready" })).toContainText("Diagram view is ready");
  await expect(page.getByRole("button", { name: /Surface Skimmer/ })).toBeVisible();
});

test("Equipment Lab recovers when the 3D module stays pending", async ({ page }) => {
  await page.route(/(?:ClarifierThreeLab-[^/]+\.js|\/src\/components\/ClarifierThreeLab\.tsx)(?:\?.*)?$/, () => new Promise(() => {}));
  await page.goto("/equipment-lab");
  await expect(page.getByRole("status").filter({ hasText: "Diagram view is ready" })).toContainText("Diagram view is ready", { timeout: 15_000 });
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Surface Skimmer/ })).toBeVisible();
});

for (const viewport of [{ width: 1280, height: 800 }, { width: 390, height: 844 }]) {
  test(`3D exploded markers show their sidebar numbers at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/equipment-lab");
    // Unlike resilience tests, this regression requires the actual 3D scene.
    await expect(page.locator('canvas[data-scene-ready="true"]')).toBeVisible();
    await page.getByRole("button", { name: "Exploded", exact: true }).click();
    for (const [id, number] of Object.entries({ feedwell: "01", weir: "02", bridge: "03", scrapers: "04", hopper: "05", scum: "06", underflow: "07" })) {
      const marker = page.getByTestId(`clarifier-part-number-${id}`);
      await expect(marker).toBeVisible();
      await expect(marker).toHaveText(number);
      await expect(marker).toHaveCSS("color", "rgb(14, 116, 144)");
    }
    await page.getByRole("button", { name: "Orbit", exact: true }).click();
    await expect(page.locator('[data-testid^="clarifier-part-number-"]')).toHaveCount(0);
  });
}
