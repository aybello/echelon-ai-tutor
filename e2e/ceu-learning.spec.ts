import { expect, test, type BrowserContext, type Locator, type Page } from "@playwright/test";
import { SignJWT } from "jose";
import { randomUUID } from "node:crypto";
import mysql from "mysql2/promise";
import { readFileSync } from "node:fs";
import type { CeuCurriculum } from "../shared/ceuLearning";

const short = JSON.parse(
  readFileSync(
    new URL("../server/ceu/courses/ceu-sampling-data-quality.json", import.meta.url),
    "utf8"
  )
) as CeuCurriculum;

const base = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000";
const prefix = `ceu-browser-${randomUUID()}`;
const emails = [`${prefix}-learner@example.test`, `${prefix}-other@example.test`];

async function loginFixture(context: BrowserContext, email: string) {
  if (!['127.0.0.1', 'localhost'].includes(new URL(base).hostname)) {
    throw Error("CEU browser fixtures are restricted to a disposable loopback server.");
  }
  if (!process.env.JWT_SECRET) throw Error("Explicit test JWT_SECRET required.");
  const token = await new SignJWT({ email, type: "dashboard" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode(process.env.JWT_SECRET));
  await context.addCookies([
    {
      name: "echelon_dashboard_session",
      value: token,
      url: base,
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
}

async function connection() {
  if (!process.env.DATABASE_URL || !['127.0.0.1', 'localhost'].includes(new URL(base).hostname)) {
    throw Error("Disposable database and local server required for CEU fixtures.");
  }
  return mysql.createConnection(process.env.DATABASE_URL);
}

/** Internal fixture setup only. The learner journey itself completes module one through the UI. */
async function markRemainingModulesComplete(email: string, course: CeuCurriculum) {
  const db = await connection();
  try {
    const [rows] = await db.execute<mysql.RowDataPacket[]>(
      "SELECT stateJson FROM ceu_learning_records WHERE studentEmail=? AND courseKey=?",
      [email, course.key]
    );
    const record = JSON.parse(rows[0].stateJson);
    const at = new Date().toISOString();
    for (const module of course.modules.slice(1)) {
      record.modules[module.id].slideIndex = 6;
      record.modules[module.id].completedAt = at;
    }
    record.currentModule = course.modules.at(-1)!.id;
    await db.execute(
      "UPDATE ceu_learning_records SET stateJson=? WHERE studentEmail=? AND courseKey=?",
      [JSON.stringify(record), email, course.key]
    );
  } finally {
    await db.end();
  }
}

async function saveClick(page: Page, control: Locator) {
  await Promise.all([
    page.waitForResponse(
      response => response.url().includes("ceu.save") && response.request().method() === "POST"
    ),
    control.click(),
  ]);
}

test.afterAll(async () => {
  if (!process.env.DATABASE_URL || !['127.0.0.1', 'localhost'].includes(new URL(base).hostname)) return;
  const db = await connection();
  try {
    await db.execute("DELETE FROM ceu_learning_daily_time WHERE studentEmail IN (?,?)", emails);
    await db.execute("DELETE FROM ceu_learning_records WHERE studentEmail IN (?,?)", emails);
  } catch (error) {
    // The local preview database may intentionally be behind the approved
    // CEU migration. CI uses a fully migrated disposable database, while the
    // anonymous visual-preview journey remains useful locally.
    if ((error as { code?: string }).code !== "ER_NO_SUCH_TABLE") throw error;
  } finally {
    await db.end();
  }
});

test("public CEU courses preview a real lesson and keep final exams locked", async ({ page }, testInfo) => {
  await page.goto("/continuing-education");
  await expect(page.getByRole("link", { name: "Open pilot course", exact: true })).toHaveCount(10);

  await page.goto(`/continuing-education/${short.key}`);
  await expect(page.getByRole("navigation", { name: "Global navigation" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Echelon Institute home" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Course workspace navigation" })).toBeVisible();
  await expect(page.getByRole("heading", { name: short.title, exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in to start", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /Final exam/ })).toBeDisabled();

  await page.getByRole("button", { name: new RegExp(`1.*${short.modules[0].title}`) }).click();
  await expect(page.getByText("Slide 1 of 7", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByText("Slide 2 of 7", { exact: true })).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.locator("body").evaluate(element => element.scrollWidth)).toBeLessThanOrEqual(390);
  await testInfo.attach("ceu-mobile-lesson-player", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  });
});

test("signed-in learner completes a lesson, passes the protected final and receives a pilot certificate", async ({
  page,
  context,
  browser,
}) => {
  await loginFixture(context, emails[0]);
  await page.goto(`/continuing-education/${short.key}`);
  await page.getByLabel("Your full name").fill("Example Learner");
  await page.getByLabel("Operator ID").fill("90000064");
  await Promise.all([
    page.waitForResponse(response => response.url().includes("ceu.start") && response.request().method() === "POST"),
    page.getByRole("button", { name: "Start and save my learning" }).click(),
  ]);

  await expect(page.getByText("Slide 1 of 7", { exact: true })).toBeVisible();
  for (let index = 2; index <= 7; index++) {
    await saveClick(page, page.getByRole("button", { name: "Next", exact: true }));
    await expect(page.getByText(`Slide ${index} of 7`, { exact: true })).toBeVisible();
  }
  await saveClick(page, page.getByRole("button", { name: "Complete module" }));
  await expect(page.getByRole("heading", { name: short.modules[1].title, exact: true })).toBeVisible();

  await markRemainingModulesComplete(emails[0], short);
  await page.reload();
  await page.getByRole("button", { name: /Final exam/ }).click();
  await expect(page.getByRole("heading", { name: short.finalAssessment[0].prompt, exact: true })).toBeVisible();

  await page.route("**/api/trpc/ceu.save**", route => route.abort("failed"), { times: 1 });
  const firstQuestion = short.finalAssessment[0];
  const firstGroup = page.getByRole("group", { name: firstQuestion.prompt, exact: true });
  await firstGroup.getByRole("radio", { name: firstQuestion.choices[firstQuestion.correctIndex], exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("has not saved");
  await saveClick(page, page.getByRole("button", { name: "Retry save", exact: true }));
  await expect(page.getByRole("alert")).toHaveCount(0);

  for (const question of short.finalAssessment.slice(1)) {
    await page.getByRole("button", { name: "Next question", exact: true }).click();
    const group = page.getByRole("group", { name: question.prompt, exact: true });
    await saveClick(page, group.getByRole("radio", { name: question.choices[question.correctIndex], exact: true }));
  }
  page.once("dialog", dialog => dialog.accept());
  await saveClick(page, page.getByRole("button", { name: "Submit exam", exact: true }));
  await expect(page.getByRole("heading", { name: "You have completed the course.", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "View certificate", exact: true }).click();
  await expect(page.locator("#ceu-certificate")).toContainText("90000064");
  await expect(page.locator("#ceu-certificate")).toContainText("No approved CEUs, operator qualification or regulatory recognition awarded.");

  const other = await browser.newContext();
  try {
    await loginFixture(other, emails[1]);
    const otherPage = await other.newPage();
    await otherPage.goto(base + `/continuing-education/${short.key}`);
    await expect(otherPage.getByLabel("Your full name")).toBeVisible();
  } finally {
    await other.close();
  }
});
