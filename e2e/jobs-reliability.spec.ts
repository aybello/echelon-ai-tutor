import { expect, test } from "@playwright/test";

test("Jobs recovers a vanished last page and exposes exactly one selected province", async ({ page, context, baseURL }) => {
  const origin = new URL(baseURL ?? "http://127.0.0.1:3000").origin;
  const requestedPages: number[] = [];
  await context.route("**/*", async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() !== "GET" || url.origin !== origin) return route.abort("blockedbyclient");
    if (url.pathname.startsWith("/api/trpc/")) {
      const procedures = decodeURIComponent(url.pathname.split("/api/trpc/")[1]).split(",");
      const inputs = JSON.parse(url.searchParams.get("input") ?? "{}");
      return route.fulfill({ json: procedures.map((name, index) => {
        let value: unknown = null;
        if (name === "jobs.listJobs") {
          const input = inputs[index]?.json ?? {};
          const page = input.page ?? 1;
          requestedPages.push(page);
          // Page 2 existed when the user clicked Next, but its final job has
          // expired by the time the request completes. Page 1 still has jobs.
          const initial = requestedPages.length === 1;
          value = { jobs: page === 1 ? [{ id: 42, title: "Retained Fixture Operator", company: "Synthetic Authority", location: "Toronto, ON", province: "ON", jobType: "full-time", sourceUrl: "https://employer.example.test/posting", sourceName: "Fixture", description: null, postedAt: null, isFeatured: 0 }] : [], total: initial ? 21 : 20, page, pageSize: 20, totalPages: initial ? 2 : 1 };
        }
        if (name === "jobs.stats") value = { total: 21, isStale: false, lastRefreshedAt: null };
        return { result: { data: { json: value } } };
      }) });
    }
    if (url.pathname.startsWith("/api/")) return route.fulfill({ json: {} });
    return route.continue();
  });
  await page.goto("/jobs");
  const all = page.getByRole("button", { name: "All Provinces", exact: true });
  const ontario = page.getByRole("button", { name: "Ontario", exact: true });
  await expect(all).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator('button[aria-pressed="true"]')).toHaveCount(1);
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect.poll(() => requestedPages.slice(0, 3)).toEqual([1, 2, 1]);
  await expect(page.getByRole("button", { name: /Retained Fixture Operator/ })).toBeVisible();
  await expect(page.getByText("No postings found", { exact: true })).toHaveCount(0);
  await ontario.click();
  await expect(ontario).toHaveAttribute("aria-pressed", "true");
  await expect(all).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator('button[aria-pressed="true"]')).toHaveCount(1);
});
