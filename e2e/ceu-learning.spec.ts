import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { SignJWT } from "jose";
import { randomUUID } from "node:crypto";
import mysql from "mysql2/promise";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import type { CeuCurriculum, CeuExerciseAnswer } from "../shared/ceuLearning";
const short = JSON.parse(
  readFileSync(
    new URL(
      "../server/ceu/courses/ceu-sampling-data-quality.json",
      import.meta.url
    ),
    "utf8"
  )
) as CeuCurriculum;
const flagship = JSON.parse(
  readFileSync(
    new URL(
      "../server/ceu/courses/ceu-water-treatment-process-control.json",
      import.meta.url
    ),
    "utf8"
  )
) as CeuCurriculum;
// The Playwright runner does not load JSON imports from server/catalogue. A separate
// test-only Node process reads keyed server content; the browser never receives this key.
function fixtureExercise(courseKey: string, moduleId: string, seed: string) {
  const expression = `import {exerciseFor} from "./server/ceu/exerciseBank.ts"; process.stdout.write(JSON.stringify(exerciseFor(${JSON.stringify(courseKey)},${JSON.stringify(moduleId)},${JSON.stringify(seed)})))`;
  return JSON.parse(
    execFileSync(
      process.execPath,
      ["--import", "tsx", "--input-type=module", "-e", expression],
      { cwd: process.cwd(), encoding: "utf8" }
    )
  ) as {
    id: string;
    prompt: string;
    type: "number" | "single" | "multiple" | "order";
    choices?: string[];
    correct: CeuExerciseAnswer;
  }[];
}
const base = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000";
const prefix = `ceu-browser-${randomUUID()}`;
const emails = [
  `${prefix}-short@example.test`,
  `${prefix}-flagship@example.test`,
  `${prefix}-other@example.test`,
];
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
async function connection() {
  if (
    !process.env.DATABASE_URL ||
    !["127.0.0.1", "localhost"].includes(new URL(base).hostname)
  )
    throw Error(
      "Disposable database and local server required for CEU fixtures."
    );
  return mysql.createConnection(process.env.DATABASE_URL);
}
async function seedModuleTime(
  email: string,
  course: CeuCurriculum,
  id: string
) {
  const db = await connection();
  try {
    const [rows] = await db.execute<mysql.RowDataPacket[]>(
      "SELECT stateJson FROM ceu_learning_records WHERE studentEmail=? AND courseKey=?",
      [email, course.key]
    );
    const record = JSON.parse(rows[0].stateJson);
    record.modules[id].activeSeconds =
      course.modules
        .find(m => m.id === id)!
        .activities.reduce((s, a) => s + a.minutes, 0) * 60;
    const total = Object.values(
      record.modules as Record<string, { activeSeconds: number }>
    ).reduce((s, m) => s + m.activeSeconds, 0);
    await db.execute(
      "UPDATE ceu_learning_records SET stateJson=?, activeSeconds=? WHERE studentEmail=? AND courseKey=?",
      [JSON.stringify(record), total, email, course.key]
    );
    return record.modules[id].exerciseSeed as string;
  } finally {
    await db.end();
  }
}
async function seedRemainingTime(email: string, course: CeuCurriculum) {
  const db = await connection();
  try {
    const [rows] = await db.execute<mysql.RowDataPacket[]>(
      "SELECT stateJson FROM ceu_learning_records WHERE studentEmail=? AND courseKey=?",
      [email, course.key]
    );
    const record = JSON.parse(rows[0].stateJson);
    const total = Object.values(
      record.modules as Record<string, { activeSeconds: number }>
    ).reduce((s, m) => s + m.activeSeconds, 0);
    record.modules[course.modules.at(-1)!.id].activeSeconds += Math.max(
      0,
      course.plannedMinutes * 60 - total
    );
    await db.execute(
      "UPDATE ceu_learning_records SET stateJson=?, activeSeconds=? WHERE studentEmail=? AND courseKey=?",
      [JSON.stringify(record), course.plannedMinutes * 60, email, course.key]
    );
  } finally {
    await db.end();
  }
}
async function saveClick(page: Page, button: ReturnType<Page["getByRole"]>) {
  await Promise.all([
    page.waitForResponse(
      r => r.url().includes("ceu.save") && r.request().method() === "POST"
    ),
    button.click(),
  ]);
}
async function answerCase(
  page: Page,
  course: CeuCurriculum,
  id: string,
  seed: string
) {
  const items = fixtureExercise(course.key, id, seed);
  for (const item of items) {
    const answer = item.correct as CeuExerciseAnswer;
    if (item.type === "number") {
      await page.getByLabel(item.prompt, { exact: false }).fill(String(answer));
    } else if (item.type === "single") {
      await page
        .getByRole("group", { name: item.prompt, exact: true })
        .getByRole("radio", {
          name: item.choices![answer as number],
          exact: true,
        })
        .check();
    } else if (item.type === "multiple") {
      for (const index of answer as number[])
        await page
          .getByRole("group", { name: new RegExp(item.prompt) })
          .getByRole("checkbox", { name: item.choices![index], exact: true })
          .check();
    } else {
      for (const [i, index] of (answer as number[]).entries())
        await page
          .getByLabel(`${item.prompt} step ${i + 1}`)
          .selectOption(String(index));
    }
  }
  await saveClick(
    page,
    page.getByRole("button", { name: "Submit case exercise" })
  );
  await expect(
    page.getByText("Case exercise passed.", { exact: true })
  ).toBeVisible();
}
async function journey(page: Page, course: CeuCurriculum, email: string) {
  const path = `/continuing-education/${course.key}`;
  await page.goto(path);
  await page.getByLabel("Your full name").fill("Example Learner");
  await page.getByLabel("WWOCS operator ID").fill("90000064");
  await page
    .getByRole("button", { name: "Start and save my learning" })
    .click();
  await expect(
    page.getByRole("heading", { name: course.modules[0].title, exact: true })
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Final assessment", exact: true })
    .click();
  await expect(page.getByText(/to unlock the final assessment/)).toBeVisible();
  for (const [i, module] of course.modules.entries()) {
    const seed = await seedModuleTime(email, course, module.id);
    await page.reload();
    if (i > 0)
      await page
        .getByRole("button", { name: `${i + 1}. ${module.title}`, exact: true })
        .click();
    await expect(
      page.getByRole("heading", { name: module.title, exact: true })
    ).toBeVisible();
    await answerCase(page, course, module.id, seed);
    for (const q of module.checks) {
      const group = page.getByRole("group", { name: q.prompt, exact: true });
      await group
        .getByRole("radio", { name: q.choices[q.correctIndex], exact: true })
        .check();
      await saveClick(
        page,
        group.locator("..").getByRole("button", { name: "Check answer" })
      );
    }
  }
  await seedRemainingTime(email, course);
  await page.reload();
  await page
    .getByRole("button", { name: "Final assessment", exact: true })
    .click();
  for (const q of course.finalAssessment)
    await page
      .getByRole("group", { name: q.prompt, exact: true })
      .getByRole("radio", { name: q.choices[q.correctIndex], exact: true })
      .check();
  await saveClick(
    page,
    page.getByRole("button", { name: "Submit assessment" })
  );
  await expect(
    page.getByRole("heading", { name: "Pilot learning completed", exact: true })
  ).toBeVisible();
  await expect(page.locator(".ceu-print-record")).toContainText("90000064");
  await expect(page.locator(".ceu-print-record")).toContainText(
    "No approved CEUs"
  );
}
test.afterAll(async () => {
  if (process.env.DATABASE_URL) {
    const db = await connection();
    await db.execute(
      "DELETE FROM ceu_learning_daily_time WHERE studentEmail IN (?,?,?)",
      emails
    );
    await db.execute(
      "DELETE FROM ceu_learning_records WHERE studentEmail IN (?,?,?)",
      emails
    );
    await db.end();
  }
});
test("ten public courses, private answers and mobile layout", async ({
  page,
}, testInfo) => {
  await page.goto("/continuing-education");
  await expect(
    page.getByRole("link", { name: "Open pilot course", exact: true })
  ).toHaveCount(10);
  await page.goto(`/continuing-education/${short.key}`);
  await expect(
    page.getByRole("heading", { name: short.title, exact: true })
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Submit case exercise" })
  ).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.locator("body").evaluate(el => el.scrollWidth)
  ).toBeLessThanOrEqual(390);
  await testInfo.attach("ceu-mobile-lesson", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  });
});
test("short course finishes without an admin and remains private to its learner", async ({
  page,
  context,
  browser,
}) => {
  await loginFixture(context, emails[0]);
  await journey(page, short, emails[0]);
  const other = await browser.newContext();
  await loginFixture(other, emails[2]);
  const otherPage = await other.newPage();
  await otherPage.goto(base + `/continuing-education/${short.key}`);
  await expect(
    otherPage.getByRole("button", { name: "Start and save my learning" })
  ).toBeVisible();
  await other.close();
});
test("ten-hour flagship finishes without an admin", async ({
  page,
  context,
}) => {
  await loginFixture(context, emails[1]);
  await journey(page, flagship, emails[1]);
});
