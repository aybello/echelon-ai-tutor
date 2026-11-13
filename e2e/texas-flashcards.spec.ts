import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { formatPriceCAD, getActiveIndividualProductByKey } from "../shared/products";

const COURSE_KEY = "us-texas-class-d-water";
const FLASHCARD_PATH = `/${COURSE_KEY}-flashcards`;
const product = getActiveIndividualProductByKey(COURSE_KEY)!;
const priceLabel = formatPriceCAD(product.priceCAD);
const reviewed = JSON.parse(readFileSync(new URL(
  "../content/us-texas-class-d-water/texas-class-d-reviewed-package.json",
  import.meta.url,
), "utf8")) as {
  bank: { modules: string[]; totalQuestions: number };
  questions: {
    questionNum: number;
    module: string;
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    difficulty: string;
    isCalc: "yes" | "no";
  }[];
};
// Use an original governed conceptual item, not a synthetic or reindexed card.
const sourceQuestion = reviewed.questions.find(q => q.module === "Disinfection" && q.isCalc === "no")!;
const calculation = reviewed.questions.find(q => q.isCalc === "yes")!;
function apiQuestion(question: typeof sourceQuestion) {
  return { ...question, id: question.questionNum, isCalc: question.isCalc === "yes" };
}

type Call = { name: string; input: any };
async function mockTexasApis(page: Page, options: {
  entitled?: boolean;
  bankState?: "empty" | "error";
  holdQuestions?: Promise<void>;
  holdAccess?: Promise<void>;
} = {}) {
  const calls: Call[] = [];
  const pageErrors: string[] = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  // No third-party traffic or real API requests, including progress/checkout writes.
  await page.route("**/*", async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin !== new URL(test.info().project.use.baseURL!).origin) return route.abort();
    if (!url.pathname.startsWith("/api/trpc/")) {
      if (url.pathname.startsWith("/api/")) return route.fulfill({ json: {} });
      return route.continue();
    }
    const names = decodeURIComponent(url.pathname.split("/api/trpc/")[1]).split(",");
    const batched = url.searchParams.has("batch");
    const payload = request.method() === "GET"
      ? JSON.parse(url.searchParams.get("input") ?? "{}")
      : request.postDataJSON();
    if (names.includes("quiz.getQuestions")) await options.holdQuestions;
    if (names.includes("stripe.checkAccess")) await options.holdAccess;
    const results = names.map((name, index) => {
      const input = (batched ? payload?.[index] : payload)?.json;
      calls.push({ name, input });
      if (name === "quiz.getQuestions" && options.bankState === "error") {
        return { error: { json: {
          message: "Question bank unavailable (test fixture)", code: -32603,
          data: { code: "INTERNAL_SERVER_ERROR", httpStatus: 500, path: name },
        } } };
      }
      const data = name === "auth.me" ? (options.entitled ? {
        id: 9001, name: "Texas Test Learner", email: "texas-learner@example.test", role: "user",
        phone: "+15125550100",
      } : null)
        : name === "dashboardAuth.me" ? null
        : name === "stripe.checkAccess" ? { hasAccess: options.entitled === true }
        : name === "quiz.getQuestions" ? {
          questions: options.bankState === "empty" ? [] : [apiQuestion(sourceQuestion), apiQuestion(calculation)],
          total: reviewed.bank.totalQuestions, locked: !options.entitled, trialLimit: 10,
        }
        : name === "quiz.getBankMeta" ? {
          bankKey: COURSE_KEY, modules: reviewed.bank.modules,
          totalQuestions: reviewed.bank.totalQuestions, contentVersion: 1,
        }
        : name === "quiz.getModuleOverviews" ? {}
        : name === "flashcard.getProgress" ? { knownIds: [], totalCards: 1 }
        : name === "flashcard.updateProgress" ? {
          success: true, knownIds: input.changes.filter((change: { known: boolean }) => change.known).map((change: { id: string }) => change.id),
        }
        : name === "flashcard.getAllProgress" ? []
        : name === "stripe.createCheckoutSession" ? { url: null }
        : { success: true };
      return { result: { data: { json: data } } };
    });
    return route.fulfill({ json: batched ? results : results[0] });
  });
  return { calls, pageErrors };
}

test("signed-out Texas flashcards show the existing catalogue purchase gate, not a zero-card page", async ({ page }) => {
  const { calls, pageErrors } = await mockTexasApis(page);
  await page.goto(FLASHCARD_PATH);
  await expect(page.getByRole("heading", { name: `Unlock ${product.name}`, exact: true })).toBeVisible();
  await expect(page.getByText(`Get 12 months of course access from successful payment for ${priceLabel}`, { exact: true })).toBeVisible();
  const checkout = page.getByRole("button", { name: `Buy 12-Month Exam Pass - ${priceLabel} →`, exact: true });
  await expect(checkout).toBeVisible();
  await expect(page.getByRole("button", { name: "Reveal answer", exact: true })).toHaveCount(0);
  await expect(page.getByText("No cards in this filter.", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Card 0 of 0", { exact: true })).toHaveCount(0);
  expect(calls.filter(call => call.name === "quiz.getQuestions").map(call => call.input.bankKey)).toEqual([COURSE_KEY]);
  await checkout.click();
  await expect.poll(() => calls.filter(call => call.name === "stripe.createCheckoutSession").length).toBe(1);
  expect(calls.find(call => call.name === "stripe.createCheckoutSession")!.input).toMatchObject({
    productKey: COURSE_KEY, currency: "cad", utmSource: "purchase-gate",
  });
  expect(pageErrors).toEqual([]);
});

test("server-entitled Texas learner flips an actual conceptual card and saves its original question ID", async ({ page }) => {
  const { calls, pageErrors } = await mockTexasApis(page, { entitled: true });
  await page.goto(FLASHCARD_PATH);
  const card = page.getByTestId("flashcard-study-card");
  await expect(card).toBeVisible();
  await expect(page.getByRole("heading", { name: `Unlock ${product.name}`, exact: true })).toHaveCount(0);
  await expect(page.getByTestId("flashcard-prompt")).toHaveText(sourceQuestion.question);
  await expect(page.getByText("Card 1 of 1", { exact: true })).toBeVisible();
  await expect(page.getByText(calculation.question, { exact: true })).toHaveCount(0);
  await page.locator(".fc-options > summary").click();
  await expect(page.getByRole("button", { name: "Groundwater systems", exact: true })).toBeVisible();
  await page.getByRole("button", { name: sourceQuestion.module, exact: true }).click();
  await expect(page.getByTestId("flashcard-prompt")).toHaveText(sourceQuestion.question);
  await expect(card).toHaveAttribute("aria-pressed", "false");
  await card.click();
  await expect(card).toHaveAttribute("aria-pressed", "true");
  await expect(card.locator(".fc-back")).toContainText(sourceQuestion.options[sourceQuestion.correctIndex]);
  await expect(card.locator(".fc-back")).toContainText(sourceQuestion.explanation);
  await page.getByRole("button", { name: "Hide answer", exact: true }).click();
  await expect(card).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByTestId("flashcard-prompt")).toHaveText(sourceQuestion.question);
  await card.click();
  await expect.poll(() => calls.some(call => call.name === "flashcard.getProgress")).toBe(true);
  await page.getByRole("button", { name: "Got It!", exact: true }).click();
  await expect.poll(() => calls.filter(call => call.name === "flashcard.updateProgress").length).toBe(1);
  expect(sourceQuestion.questionNum).toBeGreaterThan(1);
  expect(calls.find(call => call.name === "flashcard.updateProgress")!.input).toMatchObject({
    examType: COURSE_KEY, totalCards: 1,
    changes: [{ id: String(sourceQuestion.questionNum), known: true }],
  });
  expect(calls.find(call => call.name === "stripe.checkAccess")!.input.examType).toBe(COURSE_KEY);
  expect(pageErrors).toEqual([]);
});

test("mocked denial restores the Texas gate despite forged local purchase data", async ({ page }) => {
  await page.addInitScript(courseKey => {
    localStorage.setItem("echelon_trial_email", "texas-learner@example.test");
    localStorage.setItem("echelon_purchased_products", JSON.stringify([courseKey]));
    localStorage.setItem("echelon_subscription_exam_types", JSON.stringify([courseKey]));
  }, COURSE_KEY);
  const { calls, pageErrors } = await mockTexasApis(page);
  await page.goto(FLASHCARD_PATH);
  await expect.poll(() => calls.some(call => call.name === "stripe.checkAccess")).toBe(true);
  await expect(page.getByRole("heading", { name: `Unlock ${product.name}`, exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Reveal answer", exact: true })).toHaveCount(0);
  expect(calls.find(call => call.name === "stripe.checkAccess")!.input).toMatchObject({
    examType: COURSE_KEY, email: "texas-learner@example.test",
  });
  expect(pageErrors).toEqual([]);
});

test("existing optimistic preview ends after a delayed mocked access denial", async ({ page }) => {
  await page.addInitScript(courseKey => {
    localStorage.setItem("echelon_trial_email", "texas-learner@example.test");
    localStorage.setItem("echelon_purchased_products", JSON.stringify([courseKey]));
  }, COURSE_KEY);
  let release!: () => void;
  const holdAccess = new Promise<void>(resolve => { release = resolve; });
  const { pageErrors } = await mockTexasApis(page, { holdAccess });
  try {
    await page.goto(FLASHCARD_PATH);
    // Existing shared-gate behavior, not server entitlement proof: only the
    // server-bounded preview fixture can render during the optimistic interval.
    await expect(page.getByTestId("flashcard-prompt")).toHaveText(sourceQuestion.question);
    await expect(page.locator(".pg-outer")).toHaveCount(0);
  } finally { release(); }
  await expect(page.getByRole("heading", { name: `Unlock ${product.name}`, exact: true })).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test("Texas flashcards use the shared loading skeleton while the bank request is pending", async ({ page }) => {
  let release!: () => void;
  const holdQuestions = new Promise<void>(resolve => { release = resolve; });
  const { pageErrors } = await mockTexasApis(page, { entitled: true, holdQuestions });
  try {
    await page.goto(FLASHCARD_PATH);
    await expect(page.getByText("Loading questions…", { exact: true })).toBeVisible();
    await expect(page.getByTestId("flashcard-study-card")).toHaveCount(0);
  } finally { release(); }
  await expect(page.getByTestId("flashcard-prompt")).toHaveText(sourceQuestion.question);
  expect(pageErrors).toEqual([]);
});

for (const bankState of ["empty", "error"] as const) {
  test(`Texas ${bankState} question responses show the shared recovery skeleton instead of an empty deck`, async ({ page }) => {
    const { pageErrors } = await mockTexasApis(page, { entitled: true, bankState });
    await page.goto(FLASHCARD_PATH);
    await expect(page.getByRole("heading", { name: "Waking Up the Question Bank…", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Try Now", exact: true })).toBeVisible();
    await expect(page.getByText("No cards in this filter.", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Card 0 of 0", { exact: true })).toHaveCount(0);
    expect(pageErrors).toEqual([]);
  });
}
