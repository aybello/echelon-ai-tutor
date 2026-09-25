import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { SignJWT } from "jose";
import { randomUUID } from "node:crypto";
import mysql from "mysql2/promise";
import { readFileSync } from "node:fs";
import type { CeuCurriculum } from "../shared/ceuLearning";
const course = JSON.parse(
  readFileSync(
    new URL(
      "../server/ceu/courses/ceu-sampling-data-quality.json",
      import.meta.url
    ),
    "utf8"
  )
) as CeuCurriculum;
const base = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000";
const path = `/continuing-education/${course.key}`;
const prefix = `ceu-browser-${randomUUID()}`;
const emails = [`${prefix}-a@example.test`, `${prefix}-b@example.test`];
async function loginFixture(context: BrowserContext, email: string) {
  if (!["127.0.0.1", "localhost"].includes(new URL(base).hostname))
    throw Error(
      "CEU browser fixtures are restricted to a disposable loopback server."
    );
  if (!process.env.JWT_SECRET)
    throw Error("Explicit test JWT_SECRET required.");
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
async function saveClick(page: Page, button: ReturnType<Page["getByRole"]>) {
  await Promise.all([
    page.waitForResponse(
      r => r.url().includes("ceu.save") && r.request().method() === "POST"
    ),
    button.click(),
  ]);
  await expect(button).toBeEnabled();
}
test.afterAll(async () => {
  if (process.env.DATABASE_URL) {
    const db = await mysql.createConnection(process.env.DATABASE_URL);
    await db.execute(
      "DELETE FROM ceu_learning_records WHERE studentEmail IN (?,?)",
      emails
    );
    await db.end();
  }
});
test("ten-course public catalogue, readable mobile lessons and private instructor boundary", async ({
  page,
}, testInfo) => {
  await page.goto("/continuing-education");
  await expect(
    page.getByRole("link", { name: "Open pilot course", exact: true })
  ).toHaveCount(10);
  await page.goto(path);
  await expect(
    page.getByRole("heading", { name: course.title, exact: true })
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Submit for instructor review" })
  ).toBeDisabled();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.locator("body").evaluate(el => el.scrollWidth)
  ).toBeLessThanOrEqual(390);
  await testInfo.attach("ceu-mobile-lesson", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  });
  await page.goto("/continuing-education-review");
  await expect(page.getByRole("alert")).toContainText(
    "Administrator sign-in is required"
  );
});
test("learner drafts, module checks, assessment recovery and account isolation", async ({
  page,
  context,
  browser,
}) => {
  await loginFixture(context, emails[0]);
  await page.goto(path);
  await page
    .getByRole("button", { name: "Start and save my learning" })
    .click();
  const analysis = page.getByLabel("Your analysis");
  await expect(analysis).toBeEnabled();
  const draft =
    "My evidence-based sampling plan identifies location, timing, independent observations, method controls and the separate compliance sampling obligations. ".repeat(
      3
    );
  await analysis.fill(draft);
  await saveClick(
    page,
    page.getByRole("button", { name: "Save draft", exact: true })
  );
  await page.reload();
  await expect(analysis).toHaveValue(draft);
  // An unsaved navigation cancellation must retain the practical text.
  await analysis.fill(draft + "Unsaved addition.");
  page.once("dialog", d => d.dismiss());
  await page
    .getByRole("button", { name: `2. ${course.modules[1].title}`, exact: true })
    .click();
  await expect(analysis).toHaveValue(draft + "Unsaved addition.");
  await saveClick(
    page,
    page.getByRole("button", { name: "Save draft", exact: true })
  );
  for (const [i, m] of course.modules.entries()) {
    if (i > 0) {
      await page
        .getByRole("button", { name: `${i + 1}. ${m.title}`, exact: true })
        .click();
      await expect(
        page.getByRole("heading", { name: m.title, exact: true })
      ).toBeVisible();
      await expect(analysis).toBeEnabled();
    }
    await analysis.fill(draft + ` Module ${i + 1} evidence review.`);
    await saveClick(
      page,
      page.getByRole("button", {
        name: "Submit for instructor review",
        exact: true,
      })
    );
    for (const q of m.checks) {
      const group = page.getByRole("group", { name: q.prompt, exact: true });
      await group
        .getByRole("radio", { name: q.choices[q.correctIndex], exact: true })
        .check();
      await saveClick(
        page,
        group
          .locator("..")
          .getByRole("button", { name: "Check answer", exact: true })
      );
    }
  }
  await page
    .getByRole("button", { name: "Final assessment", exact: true })
    .click();
  for (const q of course.finalAssessment.slice(0, 2))
    await page
      .getByRole("group", { name: q.prompt, exact: true })
      .getByRole("radio", { name: q.choices[q.correctIndex], exact: true })
      .check();
  const draftButton = page.getByRole("button", {
    name: "Save assessment draft",
    exact: true,
  });
  await Promise.all([
    page.waitForResponse(
      r => r.url().includes("ceu.save") && r.request().method() === "POST"
    ),
    draftButton.click(),
  ]);
  await expect(draftButton).toBeDisabled();
  await page.reload();
  await page
    .getByRole("button", { name: "Final assessment", exact: true })
    .click();
  for (const q of course.finalAssessment.slice(0, 2))
    await expect(
      page
        .getByRole("group", { name: q.prompt, exact: true })
        .getByRole("radio", { name: q.choices[q.correctIndex], exact: true })
    ).toBeChecked();
  for (const q of course.finalAssessment.slice(2))
    await page
      .getByRole("group", { name: q.prompt, exact: true })
      .getByRole("radio", { name: q.choices[q.correctIndex], exact: true })
      .check();
  await page
    .getByRole("button", { name: "Submit assessment", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Submit assessment", exact: true })
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "My learning record", exact: true })
    .click();
  await expect(page.getByText(/Attempt 1: 8\/8/)).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Pilot learning completed", exact: true })
  ).toHaveCount(0);
  const other = await browser.newContext();
  await loginFixture(other, emails[1]);
  const otherPage = await other.newPage();
  await otherPage.goto(base + path);
  await expect(
    otherPage.getByRole("button", { name: "Start and save my learning" })
  ).toBeVisible();
  await expect(otherPage.getByLabel("Your analysis")).toHaveValue("");
  await other.close();
});
