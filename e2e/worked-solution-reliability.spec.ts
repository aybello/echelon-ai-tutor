import { test, expect, type Page } from "@playwright/test";

const formula = "Load per leg = 360 kg ÷ 2 = 180 kg.";
const questionText = "A 360 kg enclosure is lifted level by two vertical sling legs that share the load equally. Ignoring sling weight, what load does each leg carry?";
const identify = "Total balanced load = 360 kg and number of equal vertical legs = 2.";

// Same batched tRPC response envelope as quiz-screen-fit.spec.ts; the beta
// endpoint reproduces q20's actual route through the shared StepSolution.
async function mockStudy(page: Page, steps: unknown) {
  await page.route("**/*", async route => {
    const url = new URL(route.request().url());
    if (url.pathname.startsWith("/api/trpc/")) {
      const paths = decodeURIComponent(url.pathname.split("/api/trpc/")[1]).split(",");
      const results = paths.map(path => {
        let value: unknown = { success: true };
        if (path === "auth.me" || path === "dashboardAuth.me") value = null;
        else if (path === "stripe.checkAccess") value = { hasAccess: true, unlockedExamTypes: ["electrician-309a"] };
        else if (path === "quiz.getMissedQuestions") value = { questions: [], total: 0 };
        else if (path === "quiz.getBookmarks" || path === "quiz.getLowConfidenceQuestions") value = [];
        else if (path === "electricianReview.get309ABetaPractice") value = {
          questions: [{ id: 20, module: "A", taskCode: "A-2", topic: "Balanced lifting load", difficulty: "medium", question: questionText, options: ["90 kg", "120 kg", "180 kg", "360 kg"], correctIndex: 2, explanation: "With two vertical legs sharing a balanced load equally, each leg carries one-half of the total load.", steps, isCalc: true }], total: 1,
        };
        return { result: { data: { json: value } } };
      });
      return route.fulfill({ contentType: "application/json", body: JSON.stringify(url.searchParams.has("batch") ? results : results[0]) });
    }
    // No external services or backend writes during this browser regression.
    if (url.origin !== new URL(test.info().project.use.baseURL!).origin) return route.abort();
    if (url.pathname.startsWith("/api/") || route.request().method() !== "GET") return route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    return route.continue();
  });
}

const cases: { name: string; steps: unknown; labels: string[]; bodies: string[]; omitted?: string }[] = [
  { name: "canonical", steps: [{ l: "Identify", c: identify }, { l: "Calculate", c: formula }], labels: ["IDENTIFY", "CALCULATE"], bodies: [identify, formula] },
  { name: "legacy beta q20 aliases", steps: [{ label: "Identify", content: identify }, { label: "Calculate", content: formula }], labels: ["IDENTIFY", "CALCULATE"], bodies: [identify, formula] },
  { name: "malformed objects mixed with valid steps", steps: [null, 42, "invalid", {}, { l: {}, c: { unsafe: "value" } }, { label: "Calculate", content: formula }], labels: ["CALCULATE"], bodies: [formula] },
  { name: "missing fields", steps: [{ l: "Bodyless entry" }, { label: "Empty body", content: "" }, { content: formula }], labels: [], bodies: [formula], omitted: "Bodyless entry" },
  { name: "entirely unusable steps", steps: [null, {}, { label: "Bodyless entry" }, { l: 3, c: {} }], labels: [], bodies: [], omitted: "Bodyless entry" },
];

for (const fixture of cases) {
  test(`${fixture.name}: opening worked solution never removes the quiz`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => {
      if (message.type() === "error" && /ErrorBoundary|toUpperCase|Uncaught render error/.test(message.text())) errors.push(message.text());
    });
    await mockStudy(page, fixture.steps);
    await page.goto("/electrician-309a?province=ON");
    await expect(page.getByTestId("practice-question")).toContainText(questionText);
    await page.locator(".qs-question-card button[aria-pressed]").first().click();
    await page.getByRole("button", { name: "Confirm Answer", exact: true }).click();
    await page.getByRole("button", { name: "Show worked solution", exact: true }).click();
    await expect(page.getByRole("button", { name: "Hide worked solution", exact: true })).toBeVisible();
    await expect(page.getByTestId("practice-question")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Something went wrong", exact: true })).toHaveCount(0);
    const bodies = page.locator('div[style*="JetBrains Mono"]');
    await expect(bodies).toHaveText(fixture.bodies);
    for (let i = 0; i < fixture.bodies.length; i++) await expect(bodies.nth(i)).toBeVisible();
    for (const label of fixture.labels) await expect(page.getByText(label, { exact: true })).toBeVisible();
    if (fixture.omitted) await expect(page.getByText(fixture.omitted.toUpperCase(), { exact: true })).toHaveCount(0);
    const fallback = page.getByText("Worked solution steps are unavailable for this question.", { exact: true });
    if (fixture.bodies.length === 0) await expect(fallback).toBeVisible();
    else await expect(fallback).toHaveCount(0);
    expect(errors).toEqual([]);
    await page.getByRole("button", { name: "Hide worked solution", exact: true }).click();
    await expect(page.getByTestId("practice-question")).toBeVisible();
    await expect(page.getByRole("button", { name: "Show worked solution", exact: true })).toBeVisible();
  });
}
