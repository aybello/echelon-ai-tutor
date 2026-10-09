import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildStudyPlanSteps } from "./previewStudyPlanEmail";
import { studyPlanCaptureInput } from "./routers";
import { buildPreviewDiagnostic } from "../shared/previewDiagnostic";

/**
 * The paywall used to be a single yes-or-no moment. Over a 30 day window 78
 * learners used the entire free preview and only 2 were reachable afterwards,
 * so every learner who was interested but not ready to buy that minute was
 * lost permanently.
 *
 * The study plan path keeps that relationship open. These tests protect the
 * two properties that make it worth having: the plan must be built from the
 * learner's own answers rather than being generic, and the capture must never
 * get in the way of the sale or be discarded by a mail failure.
 */

const root = join(__dirname, "..");
const read = (relativePath: string) =>
  readFileSync(join(root, relativePath), "utf8");

describe("preview study plan keeps unconverted learners reachable", () => {
  it("names the learner's weakest topic first", () => {
    const steps = buildStudyPlanSteps({
      score: 60,
      weakTopics: ["Disinfection", "Hydraulics"],
      courseLabel: "Class 1 Water Treatment",
    });
    expect(steps[0]).toContain("Disinfection");
    expect(steps[1]).toContain("Hydraulics");
  });

  it("gives a perfect scorer something useful instead of a weak topic", () => {
    const steps = buildStudyPlanSteps({
      score: 100,
      weakTopics: [],
      courseLabel: "Class 1 Water Treatment",
    });
    expect(steps[0]).toContain("Class 1 Water Treatment");
    expect(steps.join(" ")).not.toContain("undefined");
  });

  it("advises exam pace for strong scores and spacing for weak ones", () => {
    const strong = buildStudyPlanSteps({ score: 90, weakTopics: ["Math"], courseLabel: "C" });
    const weak = buildStudyPlanSteps({ score: 40, weakTopics: ["Math"], courseLabel: "C" });
    expect(strong.join(" ")).toContain("exam pace");
    expect(weak.join(" ")).toContain("daily sessions");
  });

  it("never promises an exam outcome", () => {
    for (const score of [0, 50, 100]) {
      const text = buildStudyPlanSteps({
        score,
        weakTopics: score === 100 ? [] : ["Hydraulics"],
        courseLabel: "Class 1 Water Treatment",
      }).join(" ").toLowerCase();
      expect(text).not.toContain("guarantee");
      expect(text).not.toContain("you will pass");
    }
  });

  it("builds the plan from the same diagnostic the learner was shown", () => {
    // The gate displays this diagnostic, and the email must agree with it.
    // A plan that contradicts the on-screen result destroys trust.
    const history = [
      { module: "Disinfection", correct: false },
      { module: "Disinfection", correct: false },
      { module: "Hydraulics", correct: true },
    ];
    const diagnostic = buildPreviewDiagnostic(history, 3);
    const steps = buildStudyPlanSteps({
      score: diagnostic.score,
      weakTopics: diagnostic.weakTopics,
      courseLabel: "Class 1 Water Treatment",
    });
    expect(diagnostic.weakTopics[0]).toBe("Disinfection");
    expect(steps[0]).toContain("Disinfection");
  });

  it("escapes course labels before placing them in an HTML email", () => {
    const source = read("server/previewStudyPlanEmail.ts");
    expect(source).toContain("function escapeHtml");
    expect(source).toContain("escapeHtml(courseLabel)");
  });

  it("stores the lead before attempting delivery", () => {
    const routers = read("server/routers.ts");
    const endpoint = routers.slice(
      routers.indexOf("studyPlan: publicProcedure"),
      routers.indexOf("studyPlan: publicProcedure") + 4000
    );
    const insertAt = endpoint.indexOf("db.insert(trialEmails)");
    const sendAt = endpoint.indexOf("sendPreviewStudyPlanEmail");
    expect(insertAt).toBeGreaterThan(-1);
    expect(sendAt).toBeGreaterThan(-1);
    // A mail outage must never cost us the lead.
    expect(insertAt).toBeLessThan(sendAt);
    expect(endpoint).toContain("Delivery failed after capture");
  });

  it("records the capture server-side so it cannot be undercounted", () => {
    const routers = read("server/routers.ts");
    expect(routers).toContain('trackEvent("preview_plan_requested"');
    const analytics = read("server/analytics.ts");
    expect(analytics).toContain('| "preview_plan_requested"');
  });

  it("tags the lead with the course that earned it", () => {
    const routers = read("server/routers.ts");
    const endpoint = routers.slice(
      routers.indexOf("studyPlan: publicProcedure"),
      routers.indexOf("studyPlan: publicProcedure") + 2600
    );
    expect(endpoint).toContain("source: input.productKey");
  });

  it("places the capture after the offer so it never competes with the sale", () => {
    const gate = read("client/src/components/QuizGate.tsx");
    const buyAt = gate.indexOf("Continue with 12-Month Exam Pass");
    const captureAt = gate.indexOf("Not ready today? Get your free study plan");
    expect(buyAt).toBeGreaterThan(-1);
    expect(captureAt).toBeGreaterThan(buyAt);
  });

  it("shows the capture on the dashboard funnel", () => {
    const admin = read("server/routers/admin.ts");
    expect(admin).toContain('previewPlansRequested: eventCount("preview_plan_requested")');
  });

  it("collects a phone number alongside the email", () => {
    // Asserted against the real contract, not its source text, so moving the
    // schema out of the endpoint body cannot silently weaken this guarantee.
    const parsed = studyPlanCaptureInput.parse({
      email: "learner@example.com",
      productKey: "class1-water",
      score: 60,
      correct: 9,
      total: 15,
      weakTopics: [],
      phone: " 613-555-0123 ",
    });
    expect(parsed.phone).toBe("613-555-0123");
    expect(read("server/routers.ts")).toContain("phone: input.phone?.trim() || null");
    const gate = read("client/src/components/QuizGate.tsx");
    expect(gate).toContain('type="tel"');
  });

  it("keeps the phone optional so it never blocks an email capture", () => {
    // A required phone at this moment would cost more leads than the extra
    // channel is worth. Phone is required at checkout, where intent is proven.
    const parsed = studyPlanCaptureInput.parse({
      email: "learner@example.com",
      productKey: "class1-water",
      score: 60,
      correct: 9,
      total: 15,
      weakTopics: [],
    });
    expect(parsed.phone).toBeUndefined();
    const schema = read("drizzle/schema.ts");
    const table = schema.slice(
      schema.indexOf('export const trialEmails'),
      schema.indexOf('export type TrialEmail')
    );
    expect(table).toContain('phone: varchar("phone", { length: 32 })');
    expect(table).not.toMatch(/phone: varchar\("phone", \{ length: 32 \}\)\.notNull\(\)/);
  });

  it("makes captured leads visible and exportable to the owner", () => {
    // A lead the owner cannot see or export is not a lead.
    const admin = read("client/src/pages/Admin.tsx");
    expect(admin).toContain('"#", "Email", "Phone", "Course", "Date"');
    expect(admin).toContain('phone: r.phone ?? ""');
  });

  it("reports how many learners exhaust the free preview", () => {
    // Without the denominator, the capture count means nothing.
    const admin = read("server/routers/admin.ts");
    expect(admin).toContain("previewGateHits");
    expect(admin).toContain('completionReason === "preview_gate"');
    const ui = read("client/src/pages/Admin.tsx");
    expect(ui).toContain("Paywall email capture");
  });
});
