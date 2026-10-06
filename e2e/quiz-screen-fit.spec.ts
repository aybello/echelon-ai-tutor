import { test, expect, type Page, type Locator } from "@playwright/test";

const explanation = Array.from({ length: 18 }, (_, i) => `Step ${i + 1}: Keep units consistent and verify the calculation.`).join("\n");
const reply = "## Given\nFlow is 120 L/min.\n\n## Formula and why\nMultiply flow by time.\n\n## Substitute\n$120 \\times 60 = 7200$ L.\n\n## Check\n" + "The units and order of magnitude agree.\n\n".repeat(55);

async function mockStudy(page: Page, waitForBank?: () => Promise<void>) {
  await page.route("https://analytics.example.test/**", route => route.fulfill({ body: "" }));
  await page.route("**/api/trpc/**", async route => {
    const url = new URL(route.request().url());
    const paths = decodeURIComponent(url.pathname.split("/api/trpc/")[1]).split(",");
    if (paths.includes("quiz.getBankMeta")) await waitForBank?.();
    const results = paths.map(path => {
      let value: unknown = { success: true };
      if (path === "auth.me" || path === "dashboardAuth.me") value = null;
      else if (path === "stripe.checkAccess") value = { hasAccess: true, unlockedExamTypes: ["oit", "wpi-class1-water"] };
      else if (path === "quiz.getBankMeta") value = { modules: ["Math & Calculations"], totalQuestions: 20 };
      else if (path === "quiz.getModuleOverviews") value = {};
      else if (path === "quiz.getMissedQuestions") value = { questions: [], total: 0 };
      else if (path === "quiz.getRandomQuestions" || path === "quiz.getQuestions") value = {
        questions: Array.from({ length: 20 }, (_, i) => ({ id: i + 1, module: "Math & Calculations", difficulty: "medium", question: "A pump delivers 120 L/min. How much water does it deliver in one hour?", options: ["7200 L", "120 L", "2 L", "1200 L"], correctIndex: 0, correctAnswer: 0, explanation, isCalc: true })), total: 20, hasMore: false, locked: false,
      };
      else if (path === "tutor.chat") value = { reply };
      return { result: { data: { json: value } } };
    });
    await route.fulfill({ contentType: "application/json", body: JSON.stringify(url.searchParams.has("batch") ? results : results[0]) });
  });
}

async function inScreen(page: Page, locator: Locator) {
  const viewport = page.viewportSize()!;
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(-1);
  expect(box!.y).toBeGreaterThanOrEqual(-1);
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height + 1);
}
async function fits(page: Page) {
  await inScreen(page, page.locator(".practice-screen"));
  await inScreen(page, page.getByRole("complementary", { name: "AI Tutor" }));
  await inScreen(page, page.getByRole("button", { name: "Close AI Tutor" }));
  await inScreen(page, page.getByRole("textbox", { name: "Ask the AI Tutor" }));
  await inScreen(page, page.getByRole("button", { name: "Send", exact: true }));
  const overflow = await page.evaluate(() => ({ x: document.documentElement.scrollWidth - innerWidth, y: document.documentElement.scrollHeight - innerHeight }));
  expect(overflow.x).toBeLessThanOrEqual(1);
  expect(overflow.y).toBeLessThanOrEqual(1);
}

for (const [name, width, height, path] of [
  ["laptop OIT", 1440, 900, "/quiz"],
  ["short laptop WPI", 1280, 720, "/wpi-class1-water"],
  ["tablet", 820, 1180, "/class1-water"],
  ["phone", 390, 844, "/quiz"],
  ["short phone", 375, 667, "/oit-ww"],
] as const) {
  test(`${name}: quiz and tutor stay in the viewport`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height });
    await mockStudy(page);
    await page.goto(`${path}?panel=tutor&province=ON`);
    await expect(page.getByTestId("practice-question")).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Ask the AI Tutor" })).toBeVisible();
    await fits(page);
    await page.locator(".ai-tutor-prompts summary").click();
    await fits(page);
    await page.locator(".ai-tutor-prompts summary").click();
    await page.mouse.move(20, height - 30);
    await page.mouse.wheel(0, 500);
    expect(await page.evaluate(() => scrollY)).toBe(0);
    if (width > 720) {
      await inScreen(page, page.getByTestId("practice-question"));
      await inScreen(page, page.getByRole("button", { name: "Confirm Answer", exact: true }));
      const quiz = await page.locator(".practice-screen-main").boundingBox();
      const tutor = await page.locator(".practice-tutor-slot").boundingBox();
      expect(quiz!.x + quiz!.width).toBeLessThanOrEqual(tutor!.x + 1);
    }
    if (width === 1440) await page.screenshot({ path: testInfo.outputPath("laptop-screen-fit.png") });
    await page.getByRole("textbox", { name: "Ask the AI Tutor" }).fill("Explain the calculation");
    await page.getByRole("button", { name: "Send", exact: true }).click();
    await expect(page.locator(".ai-tutor-messages")).toContainText("Formula and why");
    await fits(page);
    expect(await page.locator(".ai-tutor-messages").evaluate(el => el.scrollHeight > el.clientHeight)).toBe(true);
    await page.getByRole("button", { name: "Close AI Tutor" }).click();
    await expect(page.locator(".ai-tutor-panel")).toHaveCount(0);
    expect(new URL(page.url()).searchParams.has("panel")).toBe(false);
    await page.locator('.qs-question-card button[aria-pressed]').first().click();
    await page.getByRole("button", { name: "Confirm Answer", exact: true }).click();
    await expect(page.locator(".practice-explanation")).toContainText("Keep units consistent");
    const content = page.locator(".practice-content");
    expect(await content.evaluate(el => el.scrollHeight > el.clientHeight)).toBe(true);
    await page.getByRole("button", { name: "Ask the Tutor about this question", exact: true }).click();
    await fits(page);
    await page.getByRole("textbox", { name: "Ask the AI Tutor" }).press("Escape");
    await expect(page.locator(".ai-tutor-panel")).toHaveCount(0);
  });
}

test("mobile resize keeps the tutor composer in the smaller viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockStudy(page);
  await page.goto("/quiz?panel=tutor");
  await expect(page.getByRole("textbox", { name: "Ask the AI Tutor" })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 500 });
  await fits(page);
  await page.getByRole("textbox", { name: "Ask the AI Tutor" }).fill("Still visible");
  await inScreen(page, page.getByRole("button", { name: "Send", exact: true }));
});

test("slow quiz startup never flashes a separate study-workspace page", async ({ page }) => {
  let releaseBoot!: () => void;
  let releaseQuiz!: () => void;
  let releaseBank!: () => void;
  let markQuizRequested!: () => void;
  const boot = new Promise<void>(resolve => { releaseBoot = resolve; });
  const quiz = new Promise<void>(resolve => { releaseQuiz = resolve; });
  const bank = new Promise<void>(resolve => { releaseBank = resolve; });
  const quizRequested = new Promise<void>(resolve => { markQuizRequested = resolve; });
  await mockStudy(page, () => bank);
  await page.addInitScript(() => {
    (window as any).__sawStudyInterstitial = false;
    new MutationObserver(() => {
      const text = document.body?.innerText ?? "";
      if (/Prepare for your operator exam|Your operator study workspace|Course links and resources are available below/.test(text)) {
        (window as any).__sawStudyInterstitial = true;
      }
    }).observe(document, { childList: true, subtree: true, characterData: true });
  });
  await page.route("**/*", async route => {
    const path = new URL(route.request().url()).pathname;
    if (/\/(?:src\/main\.tsx|assets\/index-[^/]+\.js)$/.test(path)) await boot;
    if (/\/(?:src\/pages\/Home\.tsx|assets\/Home-[^/]+\.js)$/.test(path)) {
      markQuizRequested();
      await quiz;
    }
    await route.fallback();
  });
  try {
    await page.goto("/quiz?panel=tutor", { waitUntil: "commit" });
    await expect(page.getByRole("status", { name: "Loading page" })).toBeVisible();
    await expect(page.locator(".ssr-content, .ssr-nav")).toHaveCount(0);
    releaseBoot();
    await quizRequested;
    await expect(page.getByRole("status", { name: "Loading page" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Loading page navigation" })).toHaveCount(0);
    releaseQuiz();
    await expect(page.getByText("Loading questions…", { exact: true })).toBeVisible();
    releaseBank();
    await expect(page.getByTestId("practice-question")).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Ask the AI Tutor" })).toBeVisible();
    expect(await page.evaluate(() => (window as any).__sawStudyInterstitial)).toBe(false);
  } finally {
    releaseBoot();
    releaseQuiz();
    releaseBank();
  }
});
