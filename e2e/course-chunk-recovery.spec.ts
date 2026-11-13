import { test, expect, type Page } from "@playwright/test";

async function mockStudy(page: Page) {
  await page.route("https://analytics.example.test/**", route => route.fulfill({ body: "" }));
  await page.route("**/api/trpc/**", async route => {
    const url = new URL(route.request().url());
    const paths = decodeURIComponent(url.pathname.split("/api/trpc/")[1]).split(",");
    const results = paths.map(path => {
      let value: unknown = { success: true };
      if (path === "auth.me" || path === "dashboardAuth.me") value = null;
      else if (path === "blog.listPosts") value = [];
      else if (path === "stripe.checkAccess") value = { hasAccess: true, unlockedExamTypes: ["oit", "class2-water", "wpi-class3-water", "electrician-309a"] };
      else if (path === "electricianReview.get309ABetaPractice") value = { questions: Array.from({ length: 20 }, (_, i) => ({ id: i + 1, module: "A", difficulty: "medium", question: "Synthetic 309A question for a deployment recovery test.", options: ["A", "B", "C", "D"], correctIndex: 0, explanation: "Synthetic test only.", isCalc: false })), total: 20 };
      else if (path === "quiz.getBankMeta") value = { modules: ["Math & Calculations"], totalQuestions: 20 };
      else if (path === "quiz.getModuleOverviews") value = {};
      else if (path === "quiz.getMissedQuestions") value = { questions: [], total: 0 };
      else if (path === "quiz.getRandomQuestions" || path === "quiz.getQuestions") value = {
        questions: Array.from({ length: 20 }, (_, i) => ({ id: i + 1, module: "Math & Calculations", difficulty: "medium", question: "Synthetic question for a deployment recovery test.", options: ["A", "B", "C", "D"], correctIndex: 0, correctAnswer: 0, explanation: "Synthetic test only.", isCalc: false })), total: 20, hasMore: false, locked: false,
      };
      return { result: { data: { json: value } } };
    });
    await route.fulfill({ contentType: "application/json", body: JSON.stringify(url.searchParams.has("batch") ? results : results[0]) });
  });
}

/** Serve the first tab a real old import map; reload receives current assets. */
async function staleTab(page: Page, pageModule: string, alwaysMissing = false) {
  let mainLoads = 0;
  let failedDownloads = 0;
  let documentLoads = 0;
  const retired = `${pageModule}-retired-test.js`;
  page.on("request", request => { if (request.isNavigationRequest() && request.frame() === page.mainFrame()) documentLoads++; });
  await page.route("**/assets/index-*.js", async route => {
    mainLoads++;
    const response = await route.fetch();
    let body = await response.text();
    if (mainLoads === 1 || alwaysMissing) {
      const pattern = new RegExp(`(?<![\\w])${pageModule}-[\\w-]+\\.js`, "g");
      expect(body).toMatch(pattern);
      body = body.replace(pattern, retired);
    }
    await route.fulfill({ response, body });
  });
  await page.route(`**/assets/${retired}`, route => {
    failedDownloads++;
    return route.fulfill({ status: 404, contentType: "text/plain", body: "Retired deployment file" });
  });
  return { documents: () => documentLoads, failures: () => failedDownloads, mainLoads: () => mainLoads };
}
async function navigateInOpenTab(page: Page, path: string) {
  // Like an internal course link, preserve the already-loaded old application.
  await page.evaluate(path => {
    history.pushState(null, "", path);
    dispatchEvent(new PopStateEvent("popstate"));
  }, path);
}

for (const [name, module, path] of [
  ["Ontario Class 2", "Class2WaterQuiz", "/class2-water"],
  ["OIT wastewater", "OITWastewaterQuiz", "/oit-ww"],
  ["WPI Class 3", "WpiClass3WaterQuiz", "/wpi-class3-water"],
  ["309A electrician", "Electrician309APractice", "/electrician-309a"],
] as const) {
  test(`${name}: an open old tab recovers its course after deployment`, async ({ page }) => {
    await mockStudy(page);
    const state = await staleTab(page, module);
    await page.goto("/");
    await expect.poll(() => state.mainLoads()).toBe(1);
    await page.waitForFunction(() => Object.keys(document.querySelector("#root") ?? {}).some(key => key.startsWith("__reactContainer$")) && !document.querySelector("#root .app-loading"));
    const target = `${path}?province=ON&panel=tutor#study`;
    await navigateInOpenTab(page, target);
    await expect(page.getByTestId("practice-question")).toBeVisible();
    await expect.poll(() => state.documents()).toBe(2);
    expect(state.failures()).toBeGreaterThan(0);
    expect(state.mainLoads()).toBe(2);
    expect(new URL(page.url()).pathname + new URL(page.url()).search + new URL(page.url()).hash).toBe(target);
    expect(await page.evaluate(() => sessionStorage.getItem("echelon:chunk-retry"))).not.toBeNull();
    await expect(page.getByText("Something went wrong", { exact: true })).toHaveCount(0);
  });
}

test("a persistent missing course file stops after one reload and provides a manual retry", async ({ page }) => {
  await mockStudy(page);
  const state = await staleTab(page, "Class2WaterQuiz", true);
  await page.goto("/");
  await page.waitForFunction(() => Object.keys(document.querySelector("#root") ?? {}).some(key => key.startsWith("__reactContainer$")) && !document.querySelector("#root .app-loading"));
  await navigateInOpenTab(page, "/class2-water?province=ON");
  await expect(page.getByRole("heading", { name: "This page could not finish loading" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Reload page", exact: true })).toBeVisible();
  await page.waitForTimeout(1500);
  expect(state.documents()).toBe(2);
  expect(state.mainLoads()).toBe(2);
  await page.getByRole("button", { name: "Reload page", exact: true }).click();
  await expect.poll(() => state.documents()).toBe(3);
  await expect(page.getByRole("heading", { name: "This page could not finish loading" })).toBeVisible();
  await page.waitForTimeout(500);
  expect(state.documents()).toBe(3);
});

test("blocked session storage keeps a usable recovery screen without an automatic reload", async ({ page }) => {
  await mockStudy(page);
  await page.addInitScript(() => {
    Object.defineProperty(window, "sessionStorage", { get() { throw new Error("Storage blocked"); } });
  });
  const state = await staleTab(page, "Class2WaterQuiz", true);
  await page.goto("/");
  await page.waitForFunction(() => Object.keys(document.querySelector("#root") ?? {}).some(key => key.startsWith("__reactContainer$")) && !document.querySelector("#root .app-loading"));
  await navigateInOpenTab(page, "/class2-water");
  await expect(page.getByRole("heading", { name: "This page could not finish loading" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Reload page", exact: true })).toBeVisible();
  expect(state.documents()).toBe(1);
});

test("offline course download failure does not reload the open tab", async ({ page }) => {
  await mockStudy(page);
  const state = await staleTab(page, "Class2WaterQuiz", true);
  await page.goto("/");
  await page.waitForFunction(() => Object.keys(document.querySelector("#root") ?? {}).some(key => key.startsWith("__reactContainer$")) && !document.querySelector("#root .app-loading"));
  await page.evaluate(() => Object.defineProperty(navigator, "onLine", { configurable: true, get: () => false }));
  await navigateInOpenTab(page, "/class2-water");
  await expect(page.getByRole("heading", { name: "This page could not finish loading" })).toBeVisible();
  expect(state.documents()).toBe(1);
  expect(await page.evaluate(() => sessionStorage.getItem("echelon:chunk-retry"))).toBeNull();
});

test("an ordinary component error is not disguised as an update or automatically reloaded", async ({ page }) => {
  await mockStudy(page);
  let documents = 0;
  page.on("request", request => { if (request.isNavigationRequest() && request.frame() === page.mainFrame()) documents++; });
  await page.route("**/assets/Class2WaterQuiz-*.js", route => route.fulfill({
    contentType: "text/javascript",
    body: 'export default function BrokenTestPage() { throw new Error("Synthetic component render error"); }',
  }));
  await page.goto("/class2-water");
  await expect(page.getByRole("heading", { name: "Something went wrong" })).toBeVisible();
  expect(documents).toBe(1);
  expect(await page.evaluate(() => sessionStorage.getItem("echelon:chunk-retry"))).toBeNull();
});
