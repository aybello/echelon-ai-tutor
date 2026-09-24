import { expect, test, type Page, type Route } from "@playwright/test";
import { scoredMockQuestionNums } from "../server/mockExamSession";
import mysql from "mysql2/promise";

const MAILPIT_URL = process.env.MAILPIT_URL ?? "http://127.0.0.1:8025";

type MailpitMessage = {
  ID: string;
  Subject: string;
  To: Array<{ Address: string }>;
};

async function waitForMessage(
  recipient: string,
  subjectIncludes: string,
): Promise<MailpitMessage> {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    const response = await fetch(`${MAILPIT_URL}/api/v1/messages?limit=100`);
    if (response.ok) {
      const payload = await response.json() as { messages?: MailpitMessage[] };
      const message = payload.messages?.find((candidate) =>
        candidate.Subject.includes(subjectIncludes)
        && candidate.To.some((address) => address.Address.toLowerCase() === recipient),
      );
      if (message) return message;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`No email for ${recipient} with subject containing ${subjectIncludes}`);
}

async function messageBody(messageId: string): Promise<string> {
  const response = await fetch(`${MAILPIT_URL}/api/v1/message/${encodeURIComponent(messageId)}`);
  if (!response.ok) throw new Error(`Could not read Mailpit message ${messageId}`);
  const payload = await response.json() as { Text?: string; HTML?: string };
  return `${payload.Text ?? ""}\n${payload.HTML ?? ""}`;
}

function otpFromSubject(subject: string): string {
  const match = subject.match(/(\d{3})\s(\d{3})/);
  if (!match) throw new Error(`OTP was not present in subject: ${subject}`);
  return `${match[1]}${match[2]}`;
}

async function signInWithOtp(page: Page, email: string, next: string) {
  await page.goto(`/login/otp?next=${encodeURIComponent(next)}`);
  await page.getByPlaceholder("your@email.com").fill(email);
  await page.getByRole("button", { name: /Send Code/i }).click();
  await expect(page.getByRole("heading", { name: "Check Your Email" })).toBeVisible();

  const emailMessage = await waitForMessage(email, "login code:");
  const code = otpFromSubject(emailMessage.Subject);
  const inputs = page.locator('input[maxlength="1"]');
  await expect(inputs).toHaveCount(6);
  for (let index = 0; index < code.length; index += 1) {
    await inputs.nth(index).fill(code[index]);
  }
  await expect(page.getByRole("heading", { name: "You're signed in!" })).toBeVisible();
}

for (const [prefix, COURSE_KEY, COURSE_NAME] of [
  ["teams", "wpi-class4-wastewater", "WPI Class IV Wastewater Treatment"],
  ["reporting", "class4-ww", "Class 4 Wastewater Treatment"],
]) {
const MANAGER_EMAIL = `${prefix}-e2e-manager@echelon.test`;
const OPERATOR_EMAIL = `${prefix}-e2e-operator@echelon.test`;
const ORG_NAME = `Echelon ${prefix} Browser QA`;

test(`${COURSE_NAME}: invitation, activation, mock recovery and manager reporting`, async ({ browser, page }) => {
  // Reproduce the path that failed for the municipal manager: OTP success is
  // sent to /account first, and /account must recognize the manager and route
  // into the team workspace instead of showing the personal-purchase empty state.
  // Model independent users behind the application's trusted reverse proxy.
  // RFC 5737 addresses keep separate fixtures from consuming one loopback IP's
  // request budget; the real production rate limits remain enabled.
  const addressBase = prefix === "teams" ? 10 : 20;
  await page.setExtraHTTPHeaders({ "X-Forwarded-For": `192.0.2.${addressBase}` });
  await signInWithOtp(page, MANAGER_EMAIL, "/account");
  await page.waitForURL(/\/team$/, { timeout: 30_000 });
  await expect(page.getByText("Manager Dashboard", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: ORG_NAME, exact: true })).toBeVisible();
  await expect(page.getByText("No purchases found")).toHaveCount(0);

  const licenceRow = page.locator("tr").filter({ hasText: COURSE_NAME });
  await expect(licenceRow).toContainText("unused");
  await licenceRow.getByRole("button", { name: "Invite" }).click();
  const inviteInput = licenceRow.getByPlaceholder("operator@email.com");
  await inviteInput.fill(OPERATOR_EMAIL);
  // Target the primary action beside the email field. The deployed manager UI
  // may insert a review step before sending, while older builds send directly.
  // Both paths must still produce the real email and state transition below.
  const inviteAction = inviteInput.locator("xpath=following-sibling::button[1]");
  await expect(inviteAction).toBeEnabled();
  const inviteActionLabel = (await inviteAction.textContent())?.trim() ?? "";
  await inviteAction.click();
  if (/review/i.test(inviteActionLabel)) {
    const reviewDialog = page.getByRole("dialog", { name: "Review Course Pass invitation" });
    await expect(reviewDialog).toBeVisible();
    await reviewDialog.getByRole("button", { name: /^Send 1 invitation$/ }).click();
  }
  await expect(page.getByText("Invitation sent")).toBeVisible();
  await expect(licenceRow).toContainText(OPERATOR_EMAIL);

  const invitationMessage = await waitForMessage(OPERATOR_EMAIL, `invited you to ${COURSE_NAME}`);
  const invitationBody = await messageBody(invitationMessage.ID);
  const claimUrl = invitationBody.match(/http:\/\/127\.0\.0\.1:3000\/course-pass\/claim\?token=[a-f0-9]{64}/i)?.[0];
  expect(claimUrl, "invitation email should contain the claim URL").toBeTruthy();

  const operatorContext = await browser.newContext({
    extraHTTPHeaders: { "X-Forwarded-For": `192.0.2.${addressBase + 1}` },
  });
  const operatorPage = await operatorContext.newPage();
  await operatorPage.goto(claimUrl!);
  await expect(operatorPage.getByText(COURSE_NAME, { exact: true })).toBeVisible();
  await operatorPage.getByRole("link", { name: /Verify Email & Continue/i }).click();

  await operatorPage.getByPlaceholder("your@email.com").fill(OPERATOR_EMAIL);
  await operatorPage.getByRole("button", { name: /Send Code/i }).click();
  await expect(operatorPage.getByRole("heading", { name: "Check Your Email" })).toBeVisible();
  const operatorOtpMessage = await waitForMessage(OPERATOR_EMAIL, "login code:");
  const operatorCode = otpFromSubject(operatorOtpMessage.Subject);
  const operatorInputs = operatorPage.locator('input[maxlength="1"]');
  for (let index = 0; index < operatorCode.length; index += 1) {
    await operatorInputs.nth(index).fill(operatorCode[index]);
  }

  await operatorPage.waitForURL(/\/course-pass\/claim\?token=/, { timeout: 30_000 });
  await expect(operatorPage.getByRole("button", { name: "Claim Course Pass" })).toBeVisible();
  await operatorPage.getByRole("button", { name: "Claim Course Pass" }).click();
  await expect(operatorPage.getByRole("button", { name: "Activate Course" })).toBeVisible();
  await operatorPage.getByRole("button", { name: "Activate Course" }).click();
  await expect(operatorPage.getByText("Course access is active")).toBeVisible();

  if (prefix === "teams") {
    await operatorPage.route("**/api/trpc/training.start*", route => route.abort());
    await operatorPage.goto("/wastewater");
    await expect(operatorPage.getByRole("combobox", { name: "Study-hours course" })).toHaveValue(COURSE_KEY);
    await operatorPage.getByRole("combobox", { name: "Study-hours course" }).click();
    await expect(operatorPage.getByText(/Connection interrupted. Unsaved time/)).toBeVisible();
    await operatorPage.waitForTimeout(2500);
    await operatorPage.unroute("**/api/trpc/training.start*");
    await operatorPage.getByRole("button", { name: "Retry saving" }).click();
    await expect(operatorPage.getByText("Recording active study time.", { exact: true })).toBeVisible();
    await operatorPage.goto("/equipment-lab");
    await expect(operatorPage.getByRole("combobox", { name: "Study-hours course" })).toHaveValue(COURSE_KEY);
    await operatorPage.getByRole("combobox", { name: "Study-hours course" }).click();
    await expect(operatorPage.getByText("Recording active study time.", { exact: true })).toBeVisible();
    await operatorPage.waitForTimeout(1500);
    await operatorPage.goto(claimUrl!);
    const db = await mysql.createConnection(process.env.DATABASE_URL!);
    try {
      await expect.poll(async () => {
        const [sessions] = await db.execute<mysql.RowDataPacket[]>("SELECT courseKey, activeSeconds FROM learning_activity_sessions WHERE studentEmail = ? AND activityType = 'process_guide'", [OPERATOR_EMAIL]);
        expect(sessions.every(s => s.courseKey === COURSE_KEY)).toBe(true);
        return sessions.filter(s => s.activeSeconds > 0).length;
      }).toBeGreaterThanOrEqual(2);
    } finally { await db.end(); }
  }
  const mockExamLink = operatorPage.getByRole("link", { name: "Take a Mock Exam" });
  await expect(mockExamLink).toHaveAttribute("href", `/${COURSE_KEY}-mock`);
  await mockExamLink.click();
  await operatorPage.waitForURL(`**/${COURSE_KEY}-mock`);

  await operatorPage.evaluate(() => {
    const original = Storage.prototype.setItem;
    (window as any).__mockWrites = 0;
    Storage.prototype.setItem = function(key, value) {
      if (key.startsWith("echelon.mock.")) (window as any).__mockWrites++;
      return original.call(this, key, value);
    };
  });
  await operatorPage.getByRole("button", { name: /Start Exam/ }).click();
  await expect(operatorPage.locator(".mes-option-btn")).toHaveCount(4);
  // Idle clock ticks must not rewrite a full question set to synchronous storage.
  await operatorPage.waitForTimeout(1500);
  const writesBefore = await operatorPage.evaluate(() => (window as any).__mockWrites);
  await operatorPage.waitForTimeout(3500);
  expect(await operatorPage.evaluate(() => (window as any).__mockWrites)).toBe(writesBefore);

  await operatorPage.locator(".mes-option-btn").first().click();
  await expect(operatorPage.locator('.mes-option-btn[aria-pressed="true"]')).toHaveCount(1);
  await operatorPage.reload();
  await expect(operatorPage.locator('.mes-option-btn[aria-pressed="true"]')).toHaveCount(1);

  // Retire the answered item while the Ontario exam is active. The attempt
  // must save, show the server-adjusted score, and retain that score on refresh.
  let retiredQuestion: number | undefined;
  if (prefix === "reporting") {
    retiredQuestion = await operatorPage.evaluate(() => {
      const key = Object.keys(sessionStorage).find(k => k.startsWith("echelon.mock."))!;
      return JSON.parse(sessionStorage.getItem(key)!).questions[0].id;
    });
    const db = await mysql.createConnection(process.env.DATABASE_URL!);
    try { await db.execute("UPDATE questions SET reviewStatus = 'in_review' WHERE bankKey = ? AND questionNum = ?", ["class4-wastewater", retiredQuestion]); }
    finally { await db.end(); }
  }
  const draft = await operatorPage.evaluate(() => {
    const key = Object.keys(sessionStorage).find(k => k.startsWith("echelon.mock."))!;
    return JSON.parse(sessionStorage.getItem(key)!);
  });
  expect(draft.questions).toHaveLength(prefix === "teams" ? 110 : 100);
  const manifest = JSON.parse(Buffer.from(draft.sessionToken.split(".")[0], "base64url").toString());
  const answeredItemIsScored = prefix === "teams" && scoredMockQuestionNums(manifest).includes(draft.questions[0].id);
  const expectedScore = prefix === "reporting" ? 0 : Number(answeredItemIsScored);
  // A lost request must leave answers recoverable and offer an explicit retry.
  await operatorPage.route("**/api/trpc/*exam.submitMock*", route => route.abort());
  operatorPage.once("dialog", dialog => dialog.accept());
  await operatorPage.getByRole("button", { name: /^Submit ✓$/ }).click();
  await expect(operatorPage.getByRole("button", { name: "Retry saving result" })).toBeVisible();
  await operatorPage.unroute("**/api/trpc/*exam.submitMock*");
  await operatorPage.getByRole("button", { name: "Retry saving result" }).click();
  await expect(operatorPage.getByText("Exam result saved.", { exact: true })).toBeVisible();
  await expect(operatorPage.locator(".mes-results-hero").getByText(`${expectedScore}%`, { exact: true })).toBeVisible();
  if (prefix === "teams") {
    const resultCards = operatorPage.locator(".mes-stats-4").locator(":scope > div");
    const expectedIncorrect = answeredItemIsScored ? 1 - expectedScore : 0;
    const expectedSkipped = answeredItemIsScored ? 99 : 100;
    await expect(resultCards.nth(0)).toHaveText(`${expectedScore}Correct`);
    await expect(resultCards.nth(1)).toHaveText(`${expectedIncorrect}Incorrect`);
    await expect(resultCards.nth(2)).toHaveText(`${expectedSkipped}Skipped`);
    const db = await mysql.createConnection(process.env.DATABASE_URL!);
    try {
      await expect.poll(async () => {
        const [sessions] = await db.execute<mysql.RowDataPacket[]>(
          "SELECT score, total FROM learning_activity_sessions WHERE studentEmail = ? AND activityType = 'mock_exam' ORDER BY startedAt DESC LIMIT 1",
          [OPERATOR_EMAIL],
        );
        return sessions[0] ? { score: Number(sessions[0].score), total: Number(sessions[0].total) } : null;
      }).toEqual({ score: expectedScore, total: 100 });
    } finally {
      await db.end();
    }
  }
  if (retiredQuestion) {
    await expect(operatorPage.getByText(/1 question\(s\) became unavailable/)).toBeVisible();
    const db = await mysql.createConnection(process.env.DATABASE_URL!);
    try { await db.execute("UPDATE questions SET reviewStatus = 'approved' WHERE bankKey = ? AND questionNum = ?", ["class4-wastewater", retiredQuestion]); }
    finally { await db.end(); }
  }
  await operatorPage.reload();
  await expect(operatorPage.getByText("Exam result saved.", { exact: true })).toBeVisible();
  await expect(operatorPage.locator(".mes-results-hero").getByText(`${expectedScore}%`, { exact: true })).toBeVisible();
  if (retiredQuestion) await expect(operatorPage.getByText(/1 question\(s\) became unavailable/)).toBeVisible();

  await expect(operatorPage.getByText("Your Score History", { exact: false })).toBeVisible();
  await expect(operatorPage.getByText(/Last 1 attempt/)).toBeVisible();
  if (prefix === "teams") {
    const db = await mysql.createConnection(process.env.DATABASE_URL!);
    try {
      await db.execute("INSERT INTO flashcard_progress (email, examType, knownIds, totalCards) VALUES (?, ?, ?, 907)",
        [OPERATOR_EMAIL, COURSE_KEY, JSON.stringify(Array.from({ length: 100 }, (_, i) => String(930001 + i)))]);
      await operatorPage.goto(`/${COURSE_KEY}-flashcards`);
      await operatorPage.route("**/api/trpc/*flashcard.updateProgress*", route => route.abort());
      await operatorPage.locator(".fc-inner").click();
      await operatorPage.getByRole("button", { name: "Got It!", exact: true }).click();
      await expect(operatorPage.getByText(/Flashcard changes are waiting to save/)).toBeVisible();
      await expect(operatorPage.getByText(/✓ Progress saved for/)).toHaveCount(0);
      await operatorPage.unroute("**/api/trpc/*flashcard.updateProgress*");
      await operatorPage.getByRole("button", { name: "Retry", exact: true }).click();
      await expect.poll(async () => {
        const [rows] = await db.execute<mysql.RowDataPacket[]>("SELECT knownIds FROM flashcard_progress_state WHERE email = ? AND examType = ?", [OPERATOR_EMAIL, COURSE_KEY]);
        return rows.length ? JSON.parse(rows[0].knownIds).length : 0;
      }).toBe(101);
      await operatorPage.reload();
      await expect(operatorPage.locator(".fc-inner")).toBeVisible();
      const [rows] = await db.execute<mysql.RowDataPacket[]>("SELECT knownIds FROM flashcard_progress_state WHERE email = ? AND examType = ?", [OPERATOR_EMAIL, COURSE_KEY]);
      expect(JSON.parse(rows[0].knownIds)).toHaveLength(101);
    } finally { await db.end(); }
  }
  // This is still the manager's authenticated browser, while the operator used
  // a separate OTP-only session. Both screens must see the same 100 attempts.
  await page.reload();
  const progressTable = page.locator("table").filter({
    has: page.locator("th").filter({ hasText: /^Readiness$/ }),
  });
  const progressRow = progressTable.locator("tbody tr").filter({ hasText: OPERATOR_EMAIL });
  await expect(progressRow.locator("td").nth(3)).toHaveText("100");
  await expect(progressRow.locator("td").nth(4)).toContainText(`${expectedScore}%`);
  await expect(progressRow.locator("td").nth(5)).not.toContainText("Not started");

  if (prefix === "reporting") {
    await operatorPage.goto("/class1-mock");
    await operatorPage.getByRole("button", { name: /Wastewater Class 1/ }).click();
    await operatorPage.getByRole("button", { name: /Start Exam/ }).click();
    await expect(operatorPage.locator(".mes-option-btn")).toHaveCount(4);
    await operatorPage.locator(".mes-option-btn").first().click();
    operatorPage.once("dialog", dialog => dialog.accept());
    await operatorPage.getByRole("button", { name: /^Submit ✓$/ }).click();
    await expect(operatorPage.getByText("Exam result saved.", { exact: true })).toBeVisible();
    await operatorPage.reload();
    await expect(operatorPage.getByText(/Last 1 attempt/)).toBeVisible();
    // The dedicated wastewater route must show the same result too.
    await operatorPage.goto("/class1-ww-mock");
    await operatorPage.getByRole("button", { name: /Start Exam/ }).click();
    await operatorPage.locator(".mes-option-btn").first().click();
    operatorPage.once("dialog", dialog => dialog.accept());
    await operatorPage.getByRole("button", { name: /^Submit ✓$/ }).click();
    await expect(operatorPage.getByText("Exam result saved.", { exact: true })).toBeVisible();
    await operatorPage.reload();
    await expect(operatorPage.getByText(/Last 2 attempts/)).toBeVisible();
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required");
  const connection = await mysql.createConnection(databaseUrl);
  try {
    const [rows] = await connection.execute(
      `SELECT l.status, l.invitedEmail, l.courseKey, l.activatedAt
       FROM team_flex_licences l
       INNER JOIN organizations o ON o.id = l.organizationId
       WHERE o.managerEmail = ? AND l.courseKey = ?`,
      [MANAGER_EMAIL, COURSE_KEY],
    );
    const [examRows] = await connection.execute(
      "SELECT score, total, passed FROM exam_results WHERE studentEmail = ? AND bankKey = ?",
      [OPERATOR_EMAIL, COURSE_KEY],
    );
    expect(examRows).toEqual([expect.objectContaining({ score: expectedScore, total: 100, passed: "no" })]);
    const [attemptRows] = await connection.execute(
      "SELECT id FROM question_attempts WHERE studentEmail = ? AND bankKey = ? AND quizMode = 'mock'",
      [OPERATOR_EMAIL, COURSE_KEY],
    );
    expect(attemptRows).toHaveLength(100);
    expect(rows).toEqual([
      expect.objectContaining({
        status: "active",
        invitedEmail: OPERATOR_EMAIL,
        courseKey: COURSE_KEY,
        activatedAt: expect.any(Date),
      }),
    ]);
  } finally {
    await connection.end();
    await operatorContext.close();
  }
});

}

test("paid practice continues past 50 questions and loads saved review slices", async ({ page }) => {
  test.setTimeout(180_000);
  const db = await mysql.createConnection(process.env.DATABASE_URL!);
  const email = "practice-e2e-learner@echelon.test";
  const bankKey = "class3-water-dist";
  let apiWindowEndsAt = 0;
  page.on("response", response => {
    if (!response.url().includes("/api/trpc/")) return;
    const resetSeconds = Number(response.headers()["ratelimit-reset"]);
    if (Number.isFinite(resetSeconds) && resetSeconds > 0) {
      apiWindowEndsAt = Date.now() + resetSeconds * 1000;
    }
  });
  try {
    await db.execute("INSERT INTO purchases (email, productKey, productName, amountCAD, stripeSessionId) VALUES (?, ?, 'Practice browser QA', 9900, 'cs_practice_browser_qa')", [email, bankKey]);
    // Reproduce metadata left behind by an import: the advertised topic no
    // longer exists on any visible question. Only actual modules should appear.
    await db.execute("INSERT INTO question_bank_meta (bankKey, modules, totalQuestions) VALUES (?, ?, 85) ON DUPLICATE KEY UPDATE modules = VALUES(modules), totalQuestions = VALUES(totalQuestions)", [bankKey, JSON.stringify(["Retired module"])]);
    for (let i = 0; i < 85; i++) {
      await db.execute("INSERT INTO questions (bankKey, questionNum, module, difficulty, question, options, correctIndex, explanation, reviewStatus, isCalc) VALUES (?, ?, ?, 'hard', ?, ?, 0, 'Browser practice QA.', 'approved', 'yes')", [
        bankKey, 960001 + i, i < 75 ? "Paging module" : "Rare module", `Browser practice item ${i + 1}`, '["Correct practice answer","Wrong B","Wrong C","Wrong D"]',
      ]);
    }
    await db.execute("INSERT INTO bookmarks (studentEmail, bankKey, questionId) VALUES (?, ?, 960081)", [email, bankKey]);
    await db.execute("INSERT INTO question_attempts (studentEmail, examType, bankKey, courseKey, questionId, topic, correct, confidence) VALUES (?, ?, ?, ?, 960082, 'Rare module', 'no', 'low')", [email, bankKey, bankKey, bankKey]);
    await page.setExtraHTTPHeaders({ "X-Forwarded-For": "192.0.2.30" });
    await page.addInitScript(() => {
      localStorage.setItem("echelon_qbank_class3-water-dist", JSON.stringify({ questions: [{ id: 42, question: "Legacy private cached question" }] }));
      localStorage.setItem("practice_progress_sentinel", "keep");
    });
    await signInWithOtp(page, email, `/${bankKey}`);
    await page.waitForURL(`**/${bankKey}`);
    await expect(page.getByTestId("practice-question")).toBeVisible();
    await expect(page.getByRole("button", { name: /Retired module/ })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Rare module/ })).toBeVisible();
    await page.getByRole("button", { name: /Paging module/ }).click();
    await page.getByRole("button", { name: /Quiz Settings/ }).click();
    await page.getByRole("button", { name: "50 Qs", exact: true }).click();
    await page.getByRole("button", { name: "Apply Settings →" }).click();
    const seen = new Set<string>();
    for (let i = 0; i < 52; i++) {
      await expect(page.getByTestId("practice-question")).toBeVisible();
      const id = (await page.getByTestId("practice-question").getAttribute("data-question-id"))!;
      expect(seen.has(id)).toBe(false);
      expect(Number(id)).toBeLessThan(960076);
      seen.add(id);
      await page.getByRole("button", { name: /^A\. Correct practice answer/ }).click();
      await page.getByRole("button", { name: "✓ Sure", exact: true }).click();
      await page.getByRole("button", { name: "Confirm Answer", exact: true }).click();
      await page.getByRole("button", { name: "Next Question →", exact: true }).click();
      if (i === 49) {
        await expect(page.getByText("Session Complete!", { exact: true })).toBeVisible();
        await page.getByRole("button", { name: "Skip feedback", exact: true }).click();
        await page.getByRole("button", { name: /New Session/ }).click();
      }
    }
    expect(seen.size).toBe(52);
    await expect.poll(async () => {
      const [rows] = await db.execute("SELECT COUNT(*) AS total FROM question_attempts WHERE studentEmail = ? AND courseKey = ? AND examType = ? AND questionId BETWEEN 960001 AND 960075 AND correct = 'yes'", [email, bankKey, bankKey]);
      return Number((rows as Array<{ total: number }>)[0].total);
    }).toBe(52);
    expect(await page.evaluate(() => localStorage.getItem("echelon_qbank_class3-water-dist"))).toBeNull();
    expect(await page.evaluate(() => localStorage.getItem("practice_progress_sentinel"))).toBe("keep");
    await expect(page.getByText("Legacy private cached question", { exact: true })).toHaveCount(0);
    // Answering 52 questions at automation speed compresses a real study session
    // into seconds. Respect the server's advertised request window before the
    // next journey; keep the production limiter and every paging assertion intact.
    const remainingWindow = apiWindowEndsAt - Date.now();
    if (remainingWindow > 0) await page.waitForTimeout(remainingWindow + 250);
    // These are outside the selected module and initial 50-item working set.
    for (const [mode, question] of [["bookmarked", "960081"], ["missed", "960082"], ["low-confidence", "960082"]]) {
      await page.goto(`/${bankKey}?mode=${mode}`);
      await expect(page.getByTestId("practice-question")).toHaveAttribute("data-question-id", question);
    }
    await page.goto(`/${bankKey}?topic=${encodeURIComponent("Rare module")}&calcOnly=true`);
    await expect(page.getByTestId("practice-question")).toBeVisible();
    expect(Number(await page.getByTestId("practice-question").getAttribute("data-question-id"))).toBeGreaterThan(960075);

    // A bookmarked obsolete topic is reconciled to All Modules once the current
    // learner-visible bank metadata loads. A learner must not reach an empty
    // screen or need to make a second selection to resume studying.
    await page.goto(`/${bankKey}?topic=${encodeURIComponent("Retired module")}`);
    await expect(page.getByTestId("practice-question")).toBeVisible();
    await expect(page.getByRole("status").filter({ hasText: "No questions are available" })).toHaveCount(0);
    await expect(page.getByText("Selected module: Retired module", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Your 0 answers", { exact: false })).toHaveCount(0);
  } finally { await db.end(); }
});
test("paid Water and OIT pages use current bank modules and keep filtering in the quiz", async ({ page }) => {
  test.setTimeout(180_000);
  const db = await mysql.createConnection(process.env.DATABASE_URL!);
  const email = "water-modules-e2e@echelon.test";
  const courses = [
    ["class1-water", "/class1-water"], ["class2-water", "/class2-water"],
    ["class3-water", "/class3-water"], ["class4-water", "/class4-water"], ["oit", "/quiz"],
  ] as const;
  const modules = ["Imported treatment process", "Imported treatment monitoring"];
  try {
    for (const [bankKey] of courses) {
      await db.execute("INSERT INTO purchases (email, productKey, productName, amountCAD, stripeSessionId) VALUES (?, ?, 'Module browser QA', 9900, ?)",
        [email, bankKey, `cs_water_modules_${bankKey}`]);
      // Reproduce the live import mismatch, including the exact broken button.
      await db.execute("INSERT INTO question_bank_meta (bankKey, modules, totalQuestions) VALUES (?, ?, 12) ON DUPLICATE KEY UPDATE modules = VALUES(modules)",
        [bankKey, JSON.stringify(["Coagulation & Flocculation"])]);
      for (let i = 0; i < 12; i++) {
        await db.execute("INSERT INTO questions (bankKey, questionNum, module, difficulty, question, options, correctIndex, explanation, reviewStatus, isCalc) VALUES (?, ?, ?, 'medium', ?, ?, 0, 'Module filter browser QA.', 'approved', 'no')",
          [bankKey, 970001 + i, modules[i < 6 ? 0 : 1], `Module QA ${bankKey} item ${i + 1}`, '["Correct","B","C","D"]']);
      }
    }
    await page.setExtraHTTPHeaders({ "X-Forwarded-For": "192.0.2.35" });
    await signInWithOtp(page, email, "/class1-water");
    await page.waitForURL("**/class1-water");
    for (const [bankKey, path] of courses) {
      await page.goto(path);
      await expect(page.getByTestId("practice-question")).toBeVisible();
      const filters = page.getByRole("group", { name: "Filter questions by module" });
      await expect(filters.getByRole("button", { name: /Coagulation & Flocculation/ })).toHaveCount(0);
      for (const [index, module] of modules.entries()) {
        const routePattern = "**/api/trpc/**";
        const exerciseTimeoutRecovery = bankKey === "class1-water" && index === 0;
        let delayRandomQuestionDelivery: ((route: Route) => Promise<void>) | null = null;
        if (index === 0) {
          delayRandomQuestionDelivery = async route => {
            if (route.request().url().includes("quiz.getRandomQuestions")) {
              await page.waitForTimeout(exerciseTimeoutRecovery ? 15_250 : 700);
            }
            await route.fallback();
          };
          await page.route(routePattern, delayRandomQuestionDelivery);
        }
        await filters.getByRole("button", { name: module, exact: true }).click();
        const question = page.getByTestId("practice-question");
        if (index === 0) {
          const loadingOverlay = page.getByRole("status").filter({ hasText: "Loading your next question" });
          await expect(loadingOverlay).toBeVisible();
          await expect(question).toBeVisible();
          await expect(page.getByRole("button", { name: "Confirm Answer", exact: true })).toBeDisabled();
          if (exerciseTimeoutRecovery) {
            await expect(page.getByRole("alert").filter({ hasText: "Question delivery is taking too long" })).toBeVisible({ timeout: 20_000 });
            await page.unroute(routePattern, delayRandomQuestionDelivery!);
            await page.getByRole("button", { name: "Retry loading questions", exact: true }).click();
          }
        }
        await expect(question).toContainText(`Module QA ${bankKey}`);
        await expect.poll(async () => Number(await question.getAttribute("data-question-id")))
          .toBeGreaterThanOrEqual(970001 + index * 6);
        const id = Number(await question.getAttribute("data-question-id"));
        expect(id).toBeLessThan(970007 + index * 6);
        await expect(page.getByText("No questions are available for this practice selection.", { exact: true })).toHaveCount(0);
        if (index === 0) {
          await expect(page.getByRole("status").filter({ hasText: "Loading your next question" })).toHaveCount(0);
          if (!exerciseTimeoutRecovery) await page.unroute(routePattern, delayRandomQuestionDelivery!);
        }
        expect(new URL(page.url()).pathname).toBe(path);
      }
      await filters.getByRole("button", { name: "All Modules", exact: true }).click();
      await expect(page.getByTestId("practice-question")).toBeVisible();
    }
  } finally { await db.end(); }
});

test("checkout receipt asks a guest to verify email before opening the purchased course", async ({ page }) => {
  await page.route("**/api/trpc/stripe.verifySession*", async route => {
    const payload = { result: { data: { json: { paid: true, email: "", productKey: "oit", requiresSignIn: true,
      unlockedExamTypes: [], accessToken: null, accessExpiresAt: null } } } };
    await route.fulfill({ contentType: "application/json", body: JSON.stringify(route.request().url().includes("batch=1") ? [payload] : payload) });
  });
  await page.goto("/purchase-success?session_id=cs_synthetic_receipt");
  await expect(page.getByRole("heading", { name: "Payment Successful!" })).toBeVisible();
  await expect(page.getByText("you do not need to purchase again", { exact: false })).toBeVisible();
  const link = page.getByRole("link", { name: /Sign in — OIT Practice Quiz/ });
  await expect(link).toHaveAttribute("href", "/login/otp?next=%2Fquiz");
  expect(await page.evaluate(() => localStorage.getItem("echelon_access_token"))).toBeNull();
});

test("question delivery failures show recovery without serving bundled or cached answers", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("echelon_qbank_class1-water", JSON.stringify({ questions: [{ id: 42, question: "Private offline fallback" }] }));
  });
  await page.route("**/api/trpc/**", async route => {
    if (route.request().url().includes("quiz.getQuestions")) {
      await route.fulfill({ status: 503, contentType: "application/json", body: '{"error":"Question service unavailable"}' });
    } else await route.continue();
  });
  await page.goto("/class1-water-flashcards");
  await expect(page.getByRole("button", { name: "Try Now", exact: true })).toBeVisible();
  await expect(page.getByText("Private offline fallback", { exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => Object.keys(localStorage).filter(key => key.startsWith("echelon_qbank_")))).toEqual([]);
});
