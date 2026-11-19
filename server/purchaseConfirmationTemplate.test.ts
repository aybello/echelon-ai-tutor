import { describe, expect, it } from "vitest";
import { getAllCourses, resolveCourseKey } from "../shared/courseRegistry";
import { isInteractiveCourseEligible } from "../shared/interactiveEligibility";
import { classifyAppRoute } from "../shared/appRoutes";
import {
  formatPurchasePaymentAmount,
  purchaseAccessLabel,
  type PurchaseConfirmationPayload,
} from "./email";
import { renderPurchaseConfirmationEmail } from "./purchaseConfirmationTemplate";

const SITE = "https://echeloninstitute.ca";
const base: PurchaseConfirmationPayload = {
  email: "learner@example.test",
  productName: "OIT Water Individual Exam Pass",
  productKey: "oit",
  amountCAD: 12_345,
  paymentCurrency: "cad",
  quizPath: "/quiz",
  mockPath: "/oit-mock",
  accessExpiresAt: "2027-09-21T14:30:00.000Z",
};

function render(overrides: Partial<PurchaseConfirmationPayload> = {}) {
  const payload = { ...base, ...overrides };
  return renderPurchaseConfirmationEmail(payload, {
    amountFormatted: formatPurchasePaymentAmount(payload.amountCAD, payload.paymentCurrency),
    accessLabel: purchaseAccessLabel(payload.accessExpiresAt),
  });
}

function hrefs(html: string): string[] {
  return Array.from(html.matchAll(/href="([^"]+)"/g), match => match[1].replace(/&amp;/g, "&"));
}

function expectLinkParity(result: ReturnType<typeof render>) {
  for (const href of hrefs(result.html)) {
    const url = new URL(href);
    expect(url.origin).toBe(SITE);
    expect(url.username).toBe("");
    expect(url.password).toBe("");
    expect(url.hash).toBe("");
    expect([...url.searchParams.keys()]).toEqual(url.search ? ["panel"] : []);
    if (url.search) expect(url.search).toBe("?panel=notes");
    expect(classifyAppRoute(url.pathname).kind).not.toBe("not-found");
    expect(result.text).toContain(href);
    expect(href).not.toContain(base.email);
  }
}

describe("renderPurchaseConfirmationEmail", () => {
  it("renders OIT's canonical quiz, mock, flashcards, notes and free games without borrowing a formula sheet", () => {
    const result = render({ quizPath: "/class1-water", mockPath: "/class1-water-mock" });
    expect(hrefs(result.html)).toEqual([
      `${SITE}/account`, `${SITE}/quiz`, `${SITE}/oit-mock`,
      `${SITE}/oit-water-flashcards`, `${SITE}/quiz?panel=notes`, `${SITE}/courses/oit/interactive`,
    ]);
    expect(result.text).toContain("Also available: free interactive practice games");
    expect(result.text).not.toContain("Formula sheet:");
    expectLinkParity(result);
  });

  it("renders Class 1 Water tools and formula sheet from the registry", () => {
    const result = render({ productKey: "class1-water", productName: "Class 1 Water Treatment Pass" });
    for (const path of ["/class1-water", "/class1-water-mock", "/class1-water-flashcards", "/class1-water?panel=notes", "/formulas-water1", "/courses/class1-water/interactive"]) {
      expect(hrefs(result.html)).toContain(`${SITE}${path}`);
    }
    expectLinkParity(result);
  });

  it("resolves legacy course aliases without using stale queued routes", () => {
    const result = render({ productKey: "class1", quizPath: "/wrong", mockPath: "/wrong-mock" });
    expect(result.text).toContain(`Question practice: ${SITE}/class1-water`);
    expect(result.text).not.toContain("/wrong");
  });

  it.each(["wpi-class1-water", "wpi-class1-wastewater", "us-class1-water", "us-class1-water-dist", "us-texas-class-d-water"])("keeps %s in its own course family", productKey => {
    const course = resolveCourseKey(productKey)!;
    const result = render({ productKey, productName: `${course.shortName} Pass` });
    const urls = hrefs(result.html);
    expect(urls).toContain(`${SITE}${course.quizPath}`);
    expect(urls).toContain(`${SITE}${course.mockExamPath}`);
    expect(urls).toContain(`${SITE}${course.flashcardPath}`);
    expect(urls).toContain(`${SITE}/courses/${productKey}/interactive`);
    expect(urls).not.toContain(`${SITE}/quiz`);
    expect(urls).not.toContain(`${SITE}/class1-water`);
    expectLinkParity(result);
  });

  it("includes classic games for OIT wastewater without claiming the OIT water pilots", () => {
    const result = render({ productKey: "oit-ww" });
    expect(hrefs(result.html)).toContain(`${SITE}/courses/oit-ww/interactive`);
    expect(result.text).not.toMatch(/pilot|11 games|five new|5 new/i);
    expectLinkParity(result);
  });

  it("includes 309A practice, flashcards and notes, but no games or unrelated formula sheet", () => {
    const result = render({ productKey: "electrician-309a", productName: "Ontario 309A Construction Electrician Pass" });
    expect(hrefs(result.html)).toEqual([
      `${SITE}/account`, `${SITE}/electrician-309a`, `${SITE}/electrician-309a-mock`,
      `${SITE}/electrician-309a-flashcards`, `${SITE}/electrician-309a?panel=notes`,
    ]);
    expect(result.text).not.toMatch(/games|formula sheet|water & wastewater operators/i);
    expectLinkParity(result);
  });

  it("does not advertise games or formulas for independent state banks without those capabilities", () => {
    const result = render({ productKey: "pa-class-e-water-distribution" });
    expect(result.text).not.toMatch(/games|formula sheet/i);
    expectLinkParity(result);
  });

  it("keeps a historic product name and only its supplied, verified study pair", () => {
    const result = render({ productKey: "historic-pass", productName: "Legacy Purchased Pass" });
    expect(result.subject).toBe("Your Legacy Purchased Pass is ready | Echelon Institute");
    expect(hrefs(result.html)).toEqual([`${SITE}/account`, `${SITE}/quiz`, `${SITE}/oit-mock`]);
    expect(result.text).toContain("Open your account to view your purchased access");
    expect(result.text).not.toMatch(/flashcards|study notes|formula sheet|games|AI Tutor/);
    expectLinkParity(result);
  });

  it.each([
    ["/historic-no-longer-routed", "/historic-mock"],
    ["/quiz", "/class1-water-mock"],
    ["/class1-water", "/oit-mock"],
    ["/account", "/account"],
  ])("falls back to the account for unknown or mismatched study pairs %s and %s", (quizPath, mockPath) => {
    expect(hrefs(render({ productKey: "unknown", quizPath, mockPath }).html)).toEqual([`${SITE}/account`]);
  });

  it.each([
    "//evil.example/quiz", "https://evil.example/quiz", "/\\evil.example/quiz",
    '/quiz" onclick="alert(1)', "/%2f%2fevil.example", "/%252f%252fevil.example",
    "/quiz?email=learner@example.test", "/quiz?token=secret", "/quiz#token=secret",
    "/quiz/../account", "/quiz\n", "/quiz%3fpanel=notes", "javascript:alert(1)",
  ])("rejects unsafe supplied paths: %s", quizPath => {
    const result = render({ productKey: "historic", quizPath, mockPath: quizPath });
    expect(hrefs(result.html)).toEqual([`${SITE}/account`]);
    expect(result.html).not.toContain("evil.example");
    expect(result.text).not.toContain("token=secret");
  });

  it("escapes every displayed payload/formatting value and strips subject header controls", () => {
    const injection = '<img src=x onerror="alert(1)"> & \'quoted\'';
    const result = renderPurchaseConfirmationEmail({
      ...base, productName: `${injection}\r\nBcc: injected@example.test`,
      email: injection, productKey: injection, quizPath: injection, mockPath: injection,
    }, { amountFormatted: injection, accessLabel: injection });
    expect(result.html).not.toContain(injection);
    expect(result.html).not.toContain("<img src=x");
    expect(result.html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt; &amp; &#39;quoted&#39;");
    expect(result.text).toContain(injection);
    expect(result.subject).not.toMatch(/[\r\n]/);
    expect(hrefs(result.html)).toEqual([`${SITE}/account`]);
  });

  it("explains the actual checkout-email and six-digit OTP flow with one primary account CTA", () => {
    const result = render();
    for (const content of [result.html, result.text]) {
      expect(content).toContain("Sign in with the email you used at checkout, then enter the 6-digit code sent to your inbox.");
      expect(content).toContain(base.email);
      expect(content).not.toMatch(/access key|unlocked instantly|instant unlock|email unlock/i);
    }
    expect(result.html.match(/>Open your account<\/a>/g)).toHaveLength(1);
    expect(hrefs(result.html).filter(href => href === `${SITE}/account`)).toHaveLength(1);
    expectLinkParity(result);
  });

  it("uses the actual historical paid amount and original USD currency, not the current catalogue price", () => {
    const result = render({ amountCAD: 17_901, paymentCurrency: "usd" });
    expect(result.text).toContain("Amount paid: US$179.01");
    expect(result.html).toContain("US$179.01");
    expect(result.text).not.toContain("CA$");
    expect(render({ amountCAD: 101, paymentCurrency: undefined }).text).toContain("CA$1.01");
  });

  it("preserves the exact recorded UTC expiry for Date and serialized payloads", () => {
    for (const accessExpiresAt of [base.accessExpiresAt, new Date("2027-09-21T14:30:00.000Z")]) {
      const result = render({ accessExpiresAt });
      expect(result.html).toContain("Access expires September 21, 2027 at 14:30 UTC.");
      expect(result.text).toContain("Access expires September 21, 2027 at 14:30 UTC.");
    }
  });

  it.each([null, "invalid-date"])("uses the unchanged recorded-term fallback for %s", accessExpiresAt => {
    const result = render({ accessExpiresAt });
    expect(result.html).toContain("Your recorded access term is available in your account.");
    expect(result.text).toContain("Your recorded access term is available in your account.");
    expect(result.text).not.toMatch(/12.month|one year|lifetime/i);
  });

  it("has no stale metrics, automatic renewal, dark blocks, emoji, em dashes or remote fonts", () => {
    const result = render();
    expect(result.html).toContain("#EDF4FF");
    expect(result.html).toContain("#1757B8");
    expect(result.html).toContain("#FFFFFF");
    expect(result.html).toContain("#000000");
    expect(result.html).toContain("Manrope,Arial,sans-serif");
    expect(result.html).toContain("'Source Sans 3',Arial,sans-serif");
    expect(result.html).toContain("max-width:600px");
    expect(result.html).toContain("echelon-icon-v2_5c9ed3a7.webp");
    for (const content of [result.html, result.text, result.subject]) {
      expect(content).not.toMatch(/400\+|100 questions|2 hours|11 games|12.month|unlimited|gradient|—|@font-face|fonts\.google|\p{Extended_Pictographic}/u);
    }
    expect(result.text).toContain("One-time payment. No automatic renewal.");
    expect(result.html).toContain("One-time payment. No automatic renewal.");
  });

  it("keeps every active course's links canonical, routable and consistent with game eligibility", () => {
    for (const course of getAllCourses().filter(entry => entry.isActive)) {
      const result = render({ productKey: course.productKey });
      expectLinkParity(result);
      expect(hrefs(result.html)).toContain(`${SITE}${course.quizPath}`);
      expect(hrefs(result.html).includes(`${SITE}/courses/${course.courseKey}/interactive`)).toBe(isInteractiveCourseEligible(course.courseKey));
    }
  });
});
