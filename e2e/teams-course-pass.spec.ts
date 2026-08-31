import { expect, test, type Page } from "@playwright/test";
import mysql from "mysql2/promise";

const MANAGER_EMAIL = "teams-e2e-manager@echelon.test";
const OPERATOR_EMAIL = "teams-e2e-operator@echelon.test";
const ORG_NAME = "Echelon Teams Browser QA";
const COURSE_NAME = "WPI Class IV Wastewater Treatment";
const COURSE_KEY = "wpi-class4-wastewater";
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

test("manager can invite an operator who claims, activates and opens the assigned Course Pass", async ({ browser, page }) => {
  // Reproduce the path that failed for the municipal manager: OTP success is
  // sent to /account first, and /account must recognize the manager and route
  // into the team workspace instead of showing the personal-purchase empty state.
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
  // Target the primary action beside the email field. Some hosted browser
  // layers relabel this confirmation action to "Review"; the behavioural
  // assertions below still require the invitation email and state transition.
  const inviteAction = inviteInput.locator("xpath=following-sibling::button[1]");
  await expect(inviteAction).toBeEnabled();
  await inviteAction.click();
  await expect(page.getByText("Invitation sent")).toBeVisible();
  await expect(licenceRow).toContainText(OPERATOR_EMAIL);

  const invitationMessage = await waitForMessage(OPERATOR_EMAIL, `invited you to ${COURSE_NAME}`);
  const invitationBody = await messageBody(invitationMessage.ID);
  const claimUrl = invitationBody.match(/http:\/\/127\.0\.0\.1:3000\/course-pass\/claim\?token=[a-f0-9]{64}/i)?.[0];
  expect(claimUrl, "invitation email should contain the claim URL").toBeTruthy();

  const operatorContext = await browser.newContext();
  const operatorPage = await operatorContext.newPage();
  await operatorPage.goto(claimUrl!);
  await expect(operatorPage.getByRole("heading", { name: COURSE_NAME })).toBeVisible();
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
  await operatorPage.getByRole("button", { name: "Claim Course Pass" }).click();
  await expect(operatorPage.getByRole("button", { name: "Activate Course" })).toBeVisible();
  await operatorPage.getByRole("button", { name: "Activate Course" }).click();
  await expect(operatorPage.getByText("Course access is active")).toBeVisible();

  const mockExamLink = operatorPage.getByRole("link", { name: "Take a Mock Exam" });
  await expect(mockExamLink).toHaveAttribute("href", `/${COURSE_KEY}-mock`);
  await mockExamLink.click();
  await operatorPage.waitForURL(`**/${COURSE_KEY}-mock`);

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
