import { expect, test } from "@playwright/test";

// Runs against the app or a private fixture bundling the unmodified actual
// ChlorineCalc component. No live data, account, purchase or write is needed.
for (const width of [1440, 390]) {
  test(`chlorine form changes use displayed purity and preserve units at ${width}px`, async ({ page, context, baseURL }) => {
    await page.setViewportSize({ width, height: 900 });
    const origin = new URL(baseURL ?? "http://127.0.0.1:3000").origin;
    const writes: string[] = [];
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await context.route("**/*", async route => {
      const request = route.request();
      const url = new URL(request.url());
      if (request.method() !== "GET") {
        writes.push(`${request.method()} ${url.pathname}`);
        return route.abort("blockedbyclient");
      }
      if (url.origin !== origin) return route.abort("blockedbyclient");
      // Do not load the development-only collector: the calculator has no
      // writes, and this harness must not send unrelated telemetry either.
      if (url.pathname.startsWith("/__manus__/")) return route.fulfill({ contentType: "text/javascript", body: "" });
      if (url.pathname.startsWith("/api/trpc/")) {
        const procedures = decodeURIComponent(url.pathname.split("/api/trpc/")[1]).split(",");
        return route.fulfill({ json: procedures.map(() => ({ result: { data: { json: null } } })) });
      }
      if (url.pathname.startsWith("/api/")) return route.fulfill({ json: {} });
      return route.continue();
    });
    await page.goto("/chem-calc");
    const form = page.getByLabel("Chemical Form", { exact: true });
    // This first assertion is deliberately independent of the new labels so it
    // fails numerically (38.46 vs 25.13), not structurally, on the old component.
    await form.selectOption("gas");
    await expect(page.getByText("25.13 kg/day", { exact: true })).toBeVisible();
    const purity = page.getByLabel(/Available Cl₂/);
    await expect(purity).toBeDisabled();
    await expect(purity).toHaveValue("99.5");
    await expect(page.getByText("17.45 g/min", { exact: true })).toBeVisible();
    await form.selectOption("granular");
    await expect(purity).toBeEnabled();
    await expect(page.getByText("38.46 kg/day", { exact: true })).toBeVisible();
    await expect(page.getByText("26.71 g/min", { exact: true })).toBeVisible();
    await purity.fill("30");
    await expect(page.getByText("83.33 kg/day", { exact: true })).toBeVisible();
    await expect(page.getByText("57.87 g/min", { exact: true })).toBeVisible();
    await form.selectOption("liquid");
    await expect(purity).toHaveValue("12.5");
    await expect(purity).toBeDisabled();
    await expect(page.getByText("166.67 L/day", { exact: true })).toBeVisible();
    await expect(page.getByText("115.74 mL/min", { exact: true })).toBeVisible();
    await expect(page.getByText("25 kg/day", { exact: true })).toBeVisible();
    await expect(page.getByText(/1.2 kg\/L × 0.125/)).toBeVisible();
    await form.selectOption("granular");
    await expect(purity).toHaveValue("30");
    await purity.fill("");
    await expect(page.getByRole("status")).toContainText("finite positive");
    await expect(page.getByText("83.33 kg/day", { exact: true })).toHaveCount(0);
    await form.selectOption("liquid");
    await expect(page.getByText("166.67 L/day", { exact: true })).toBeVisible();
    await form.selectOption("gas");
    await expect(page.getByText("25.13 kg/day", { exact: true })).toBeVisible();
    const flow = page.getByLabel("Flow Rate (m³/day)", { exact: true });
    const dose = page.getByLabel("Target Dose (mg/L)", { exact: true });
    for (const [field, restore] of [[flow, "10000"], [dose, "2.5"]] as const) {
      for (const invalid of ["", "0", "-1"]) {
        await field.fill(invalid);
        await expect(page.getByRole("status")).toContainText("finite positive");
        await expect(page.getByText("25.13 kg/day", { exact: true })).toHaveCount(0);
      }
      await field.fill(restore);
    }
    await form.selectOption("granular");
    for (const invalid of ["0", "-1", "101"]) {
      await purity.fill(invalid);
      await expect(page.getByRole("status")).toContainText("at most 100%");
    }
    await purity.fill("65");
    await expect(page.getByText("26.71 g/min", { exact: true })).toBeVisible();
    await flow.focus();
    await expect(flow).toBeFocused();
    // Check the actual calculator block, and body overflow in the isolated
    // fixture. The app's unrelated pre-existing quick-reference table is not
    // repaired by this narrowly scoped chlorine change.
    expect(await form.evaluate(el => {
      const block = el.closest("select")!.parentElement!.parentElement!.parentElement!;
      return block.scrollWidth <= block.clientWidth + 1;
    })).toBe(true);
    if (process.env.CHLORINE_COMPONENT_FIXTURE === "1") {
      expect(await page.evaluate(() => document.body.scrollWidth <= window.innerWidth)).toBe(true);
    }
    await test.info().attach(`chlorine-${width}px-layout.json`, {
      body: JSON.stringify(await page.evaluate(() => ({
        viewport: window.innerWidth, bodyScrollWidth: document.body.scrollWidth,
        documentScrollWidth: document.documentElement.scrollWidth,
      }))), contentType: "application/json",
    });
    await test.info().attach(`chlorine-${width}px.png`, {
      body: await page.screenshot({ fullPage: true }), contentType: "image/png",
    });
    expect(writes).toEqual([]);
    expect(errors).toEqual([]);
  });
}
