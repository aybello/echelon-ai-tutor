import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolveCourseKey } from "../shared/courseRegistry";
import { resolveQuizGateOffer } from "../shared/checkoutOffer";

const mail = vi.hoisted(() => ({
  sendMail: vi.fn(async (_message: { text: string; html: string }) => ({})),
}));
vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(() => ({ sendMail: mail.sendMail })),
    createTestAccount: vi.fn(() => { throw new Error("No external test accounts"); }),
    getTestMessageUrl: vi.fn(() => false),
  },
}));
vi.mock("./_core/env", () => ({
  ENV: {
    smtpHost: "not-a-real-mail-server.invalid",
    smtpUser: "fixture@example.test",
    smtpPass: "test-only-placeholder",
    isProduction: false,
  },
}));
vi.mock("./db", () => ({
  getDb: vi.fn(() => { throw new Error("No data access in communications tests"); }),
}));

import { sendTeamEnrollmentEmail } from "./email";
import { sendLeadFollowUpEmail } from "./leadFollowUpEmail";
import { sendPreviewStudyPlanEmail, type PreviewStudyPlanEmailPayload } from "./previewStudyPlanEmail";
import { resolveLeadCourse } from "./jobs/leadFollowUps";

const site = "https://echeloninstitute.ca";
const source = (relativePath: string) => readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8");
const lastMessage = () => mail.sendMail.mock.calls.at(-1)![0];
const expectLink = (html: string, url: string, label: string) => {
  expect(html).toMatch(new RegExp(`<a href="${url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[^>]*>${label}</a>`));
};

// Execute only the existing caller's pure payload-construction block. Importing
// the full router would pull unrelated services into this bounded regression.
const routers = source("server/routers.ts");
const callerStart = routers.indexOf("const course = resolveCourseKey(input.productKey)");
const callerEnd = routers.indexOf("} catch (error)", callerStart);
if (callerStart < 0 || callerEnd < 0) throw new Error("Study-plan caller block not found");
const constructStudyPlan = new Function(
  "input", "resolveCourseKey", "resolveQuizGateOffer", "sendPreviewStudyPlanEmail",
  `return (async () => { const email = input.email; ${routers.slice(callerStart, callerEnd)} })();`,
);

beforeEach(() => vi.clearAllMocks());

describe("enrollment communication matches implemented manager reporting", () => {
  it("discloses authorized manager session visibility in both formats without exposing answer content", async () => {
    await sendTeamEnrollmentEmail({
      email: "learner@example.test", orgName: "Fixture Utility",
      managerEmail: "manager@example.test", loginUrl: `${site}/login/otp`,
      courseName: "Class 1 Water Treatment",
    });
    expect(mail.sendMail).toHaveBeenCalledTimes(1);
    const message = lastMessage();
    for (const body of [message.text, message.html]) {
      expect(body).toContain("Authorized managers at Fixture Utility");
      expect(body).toContain("assigned-course activity");
      expect(body).toContain("platform-recorded study time");
      expect(body).toContain("session dates, activities, topics, and durations");
      expect(body).toContain("Managers do not receive the text of private AI Tutor conversations or individual answer content.");
      expect(body).not.toMatch(/cannot see.*session details|can see your individual question responses/);
    }
    expect(message.html).toContain("Timed mock exams with course-specific formats and timers");
    expect(message.html).not.toContain("100 questions, 2 hrs");
    // The retained answer/conversation privacy assurance has an explicit source.
    expect(source("client/src/pages/Privacy.tsx")).toContain("Managers do not receive the text of private AI Tutor conversations or individual answer content.");
  });
});

describe("practice links stay separate from purchase offers", () => {
  it.each(["oit", "class1-water", "class1-wastewater", "wpi-class1-water"])(
    "resolves %s to its canonical quiz path, including legacy aliases", sourceKey => {
      const resolved = resolveLeadCourse(sourceKey);
      expect(resolved.courseUrl).toBe(`${site}${resolveCourseKey(sourceKey)!.quizPath}`);
      expect(resolved.courseUrl).not.toContain("/pricing");
      expect(resolved.offerUrl).toBe(`${site}/pricing?course=${encodeURIComponent(sourceKey)}`);
    },
  );

  it.each(["class1-water", "class1-wastewater", "paywall_browse"])(
    "constructs and renders the real study-plan caller payload for %s", async productKey => {
      const capture = vi.fn(async (_payload: PreviewStudyPlanEmailPayload) => undefined);
      await constructStudyPlan({
        productKey, score: 60, correct: 9, total: 15, weakTopics: ["Hydraulics"],
        email: "learner@example.test", stage: "preview_complete",
      }, resolveCourseKey, resolveQuizGateOffer, capture);
      expect(capture).toHaveBeenCalledTimes(1);
      const payload = capture.mock.calls[0][0];
      const course = resolveCourseKey(productKey);
      expect(payload.courseUrl).toBe(course ? `${site}${course.quizPath}` : undefined);
      expect(payload.offerUrl).toBe(`${site}/pricing?course=${encodeURIComponent(productKey)}`);
      await sendPreviewStudyPlanEmail(payload);
      const message = lastMessage();
      const label = course ? "Keep practising" : "View course access";
      const url = payload.courseUrl ?? payload.offerUrl;
      expect(message.text).toContain(`${label}: ${url}`);
      expectLink(message.html, url, label);
      expect(message.text).toContain(`12 months: ${payload.offerUrl}`);
      expect(message.text + message.html).not.toMatch(/Pick up where you left off|undefined/);
    },
  );

  it.each([1, 2] as const)("renders stage %s follow-ups with the intended destination in both formats", async stage => {
    const resolved = resolveLeadCourse("class1-water");
    await sendLeadFollowUpEmail({
      email: "learner@example.test", stage, ...resolved,
      unsubscribeUrl: `${site}/api/unsubscribe-lead?token=fixture`,
    });
    const message = lastMessage();
    const url = stage === 1 ? resolved.courseUrl! : resolved.offerUrl;
    const label = stage === 1 ? "Keep practising" : "See the full Exam Pass";
    expect(message.text).toContain(`${label}: ${url}`);
    expectLink(message.html, url, label);
    expect(message.text + message.html).not.toContain("Pick up where you left off");
    if (stage === 1) expect(message.text + message.html).not.toContain("/pricing");
  });

  it.each([1, 2] as const)("labels unresolved stage %s follow-ups as access, not restored practice", async stage => {
    const resolved = resolveLeadCourse("paywall_browse");
    expect(resolved.courseUrl).toBeUndefined();
    await sendLeadFollowUpEmail({
      email: "learner@example.test", stage, ...resolved,
      unsubscribeUrl: `${site}/api/unsubscribe-lead?token=fixture`,
    });
    const message = lastMessage();
    expect(message.text).toContain(`View course access: ${site}/pricing`);
    expectLink(message.html, `${site}/pricing`, "View course access");
    expect(message.text + message.html).not.toMatch(/Keep practising|Pick up where you left off|free preview.*(?:still there|stays available)|undefined/);
  });

  it.each(["in_preview", "preview_complete"] as const)("keeps %s study-plan fallback labels honest", async stage => {
    await sendPreviewStudyPlanEmail({
      email: "learner@example.test", courseLabel: "your course", score: 60,
      correct: 9, total: 15, weakTopics: ["Hydraulics"],
      offerUrl: `${site}/pricing`, priceLabel: "available on the pricing page", stage,
    });
    const message = lastMessage();
    expect(message.text).toContain(`View course access: ${site}/pricing`);
    expectLink(message.html, `${site}/pricing`, "View course access");
    expect(message.text + message.html).not.toMatch(/Keep practising|Pick up where you left off|undefined/);
  });
});

describe("pricing FAQ uses the implemented account sign-in flow", () => {
  it("instructs the learner to use the six-digit purchase-email code, not a magic link", () => {
    const pricing = source("client/src/pages/Pricing.tsx");
    const start = pricing.indexOf('q: "How do I access my passes after purchase?"');
    expect(start).toBeGreaterThan(-1);
    const faq = pricing.slice(start, pricing.indexOf("},", start));
    expect(faq).toContain("echeloninstitute.ca/account");
    expect(faq).toContain("Enter the six-digit verification code sent to your purchase email to sign in on that device.");
    expect(faq).not.toContain("magic sign-in link");
  });
});
