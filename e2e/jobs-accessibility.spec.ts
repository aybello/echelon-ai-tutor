import { expect, test } from "@playwright/test";

// All API reads are synthetic. No account, application, database or external URL
// is contacted, and every non-GET request is refused before it can reach a server.
const postingUrl = "https://employer.echelon.test/jobs/water-operator?jobid=fixture-42";
const jobTitle = "Fixture Water Operator";
const description = Array.from({ length: 100 }, (_, i) => `Duty ${i + 1}: Inspect the synthetic water treatment equipment safely.`).join("\n");

for (const width of [1365, 390]) {
  test(`job details support keyboard dismissal, focus restoration and scrolling at ${width}px`, async ({ page, context, baseURL }) => {
    const height = width === 390 ? 844 : 900;
    await page.setViewportSize({ width, height });
    const origin = new URL(baseURL ?? "http://127.0.0.1:3000").origin;
    const refusedWrites: string[] = [];
    const externalRequests: string[] = [];
    await context.route("**/*", async route => {
      const request = route.request();
      const url = new URL(request.url());
      if (request.method() !== "GET") {
        refusedWrites.push(`${request.method()} ${url.pathname}`);
        return route.abort("blockedbyclient");
      }
      if (url.origin !== origin) {
        externalRequests.push(url.origin);
        return route.abort("blockedbyclient");
      }
      if (url.pathname.startsWith("/api/trpc/")) {
        const procedures = decodeURIComponent(url.pathname.split("/api/trpc/")[1]).split(",");
        const values: Record<string, unknown> = {
          "auth.me": null,
          "dashboardAuth.me": null,
          "jobs.listJobs": { jobs: [{ id: 42, title: jobTitle, company: "Fixture Water Authority", location: "Fixture, ON", province: "ON", salary: "$30/hr", jobType: "full-time", sourceUrl: postingUrl, sourceName: "Synthetic employer", description, postedAt: null, isFeatured: 0 }], total: 1, page: 1, pageSize: 20, totalPages: 1 },
          "jobs.stats": { total: 1, isStale: false, lastRefreshedAt: null },
        };
        return route.fulfill({ json: procedures.map(name => ({ result: { data: { json: values[name] ?? null } } })) });
      }
      if (url.pathname.startsWith("/api/")) return route.fulfill({ json: {} });
      return route.continue();
    });
    await page.goto("/jobs");
    const card = page.getByRole("button", { name: new RegExp(jobTitle) });
    await expect(card).toBeVisible();
    const originalBodyOverflow = await page.locator("body").evaluate(el => el.style.overflow);

    // Open from the keyboard, not a direct click that would hide focus defects.
    await card.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog", { name: jobTitle, exact: true });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute("aria-modal", "true");
    const close = dialog.getByRole("button", { name: "Close", exact: true });
    const posting = dialog.getByRole("link", { name: "View Full Posting" });
    await expect(close).toBeFocused();
    await expect(posting).toHaveAttribute("href", postingUrl);
    await expect(posting).toHaveAttribute("target", "_blank");
    await expect(posting).toHaveAttribute("rel", "noopener noreferrer");
    await expect(page.locator("body")).toHaveCSS("overflow", "hidden");

    await page.keyboard.press("Shift+Tab");
    await expect(posting).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(close).toBeFocused();
    // Modern Chromium also tabs to overflowing scroll regions so users can
    // read long descriptions with the keyboard. Every stop must remain inside.
    let reachedPosting = false;
    const focusStops: unknown[] = [];
    for (let stop = 0; stop < 4; stop++) {
      await page.keyboard.press("Tab");
      focusStops.push(await page.evaluate(() => ({
        tag: document.activeElement?.tagName,
        classes: document.activeElement?.className,
        text: document.activeElement?.textContent?.slice(0, 80),
      })));
      expect(await dialog.evaluate(el => el.contains(document.activeElement))).toBe(true);
      if (await posting.evaluate(el => el === document.activeElement)) {
        reachedPosting = true;
        break;
      }
    }
    expect(reachedPosting).toBe(true);
    await page.keyboard.press("Tab");
    await expect(close).toBeFocused();

    const body = dialog.locator(".overflow-y-auto");
    expect(await body.evaluate(el => el.scrollHeight > el.clientHeight)).toBe(true);
    await body.evaluate(el => { el.scrollTop = el.scrollHeight; });
    expect(await body.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
    const bounds = await posting.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.y).toBeGreaterThanOrEqual(0);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await test.info().attach("modal-focus-stops", { body: JSON.stringify(focusStops, null, 2), contentType: "application/json" });
    await test.info().attach("long-description-dialog", { body: await page.screenshot(), contentType: "image/png" });

    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(card).toBeFocused();
    await expect.poll(() => page.locator("body").evaluate(el => el.style.overflow)).toBe(originalBodyOverflow);

    await page.keyboard.press("Enter");
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Close", exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(card).toBeFocused();
    await expect.poll(() => page.locator("body").evaluate(el => el.style.overflow)).toBe(originalBodyOverflow);

    await page.keyboard.press("Enter");
    await expect(dialog).toBeVisible();
    // Top-left is outside both the desktop center panel and phone bottom sheet.
    await page.mouse.click(2, 2);
    await expect(dialog).toHaveCount(0);
    await expect(card).toBeFocused();
    await expect.poll(() => page.locator("body").evaluate(el => el.style.overflow)).toBe(originalBodyOverflow);
    // Any analytics writes/external assets were blocked; the posting was never opened.
    expect(externalRequests).not.toContain(new URL(postingUrl).origin);
    expect(refusedWrites.filter(value => value.includes("/api/trpc/"))).toEqual([]);
  });
}
