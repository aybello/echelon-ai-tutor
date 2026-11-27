import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { RecruitmentManagerPrivacyContext } from "@/hooks/recruitmentManagerPrivacy";
import {
  RecruitmentResults,
  recruitmentDuration,
} from "./recruitment/RecruitmentResults";
import type {
  RecruitmentDefinitionSummary,
  RecruitmentResult,
} from "../../../shared/recruitmentAssessment";

const assessment: RecruitmentDefinitionSummary = {
  id: "22222222-2222-4222-8222-222222222222",
  title: "Synthetic operator review",
  courseKey: "class2-water",
  courseLabel: "Class 2 Water",
  modules: ["Treatment"],
  questionCount: 2,
  timeLimitMinutes: 5,
  createdAtMs: 1000,
  expiresAtMs: 900000,
  candidates: 1,
  completed: 0,
};
const base: RecruitmentResult = {
  assignmentId: "11111111-1111-4111-8111-111111111111",
  memberId: 31,
  candidateEmail: "candidate@example.test",
  candidateName: "Synthetic candidate",
  status: "invited",
  startedAtMs: null,
  submittedAtMs: null,
  expiresAtMs: 900000,
  score: null,
  answers: { q1: 1 },
  revision: 0,
  questions: [
    {
      id: "q1",
      module: "Treatment",
      prompt: "Synthetic private question",
      options: ["Correct fixture option", "Chosen fixture option"],
      correctIndex: 0,
    },
  ],
};
function render(results: RecruitmentResult[]) {
  return renderToStaticMarkup(
    createElement(
      RecruitmentManagerPrivacyContext.Provider,
      {
        value: { epoch: 0, isCurrent: () => true, reset: vi.fn() },
      },
      createElement(RecruitmentResults, {
        assessment,
        results,
        onDownload: vi.fn(),
        onCopy: vi.fn(),
        onRevoke: vi.fn(),
        busy: false,
      })
    )
  );
}

beforeAll(() => vi.stubGlobal("React", React));
afterAll(() => vi.unstubAllGlobals());

describe("recruitment manager results presentation contract", () => {
  it("fails closed when used without the freshly authorized manager parent", () => {
    const html = renderToStaticMarkup(
      createElement(RecruitmentResults, {
        assessment,
        results: [base],
        onDownload: vi.fn(),
        onCopy: vi.fn(),
        onRevoke: vi.fn(),
        busy: false,
      })
    );
    expect(html).toBe("");
  });

  it("renders historical results, CSV and revocation with current reporting capability but no current-term catalog", () => {
    // The presentation capability comes only from the fresh list/results parent;
    // it must not depend on the creation/invitation catalog's Annual term.
    const html = render([base]);
    expect(assessment.expiresAtMs).toBeLessThan(Date.now());
    expect(html).toContain(base.candidateEmail);
    expect(html).toContain("Download CSV");
    expect(html).toContain('aria-label="Revoke invitation');
    expect(html).not.toContain("Team-seat candidate");
    expect(html).not.toContain("Create invitation link");
    expect(html).not.toContain("/pricing");
  });

  it("hides historical private results and every action when the reporting capability's epoch is no longer current", () => {
    const html = renderToStaticMarkup(
      createElement(
        RecruitmentManagerPrivacyContext.Provider,
        { value: { epoch: 4, isCurrent: () => false, reset: vi.fn() } },
        createElement(RecruitmentResults, {
          assessment,
          results: [base],
          onDownload: vi.fn(),
          onCopy: vi.fn(),
          onRevoke: vi.fn(),
          busy: false,
        })
      )
    );
    expect(html).toBe("");
  });

  it("explains the empty invited cohort and disables CSV instead of presenting zero scores", () => {
    const html = render([]);
    expect(html).toContain("No candidates invited yet");
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>[\s\S]*?Download CSV/);
    expect(html).not.toContain("0%");
  });

  it("instructs managers to revoke before the deadline after access loss without overstating timed-out evidence", () => {
    const html = render([base]);
    expect(html).toContain("loses team-seat or course access");
    expect(html).toContain(
      "invitation before its deadline to stop automatic scoring"
    );
    expect(html).toContain(
      "results are evidence of saved answers, not proof of uninterrupted access"
    );
  });

  it.each(["invited", "active", "expired", "revoked"] as const)(
    "does not disclose snapshot responses or manufacture a final score for an unscored %s result",
    status => {
      const html = render([{ ...base, status }]);
      if (status === "expired" || status === "revoked") {
        expect(html).toContain("No final score is available.");
        expect(html).not.toContain("will be available after submission");
      } else {
        expect(html).toContain(
          "Final scores and response review will be available after submission"
        );
        expect(html).toContain(
          "untimed assessments require submission before expiry"
        );
      }
      expect(html).not.toContain(base.questions[0].prompt);
      expect(html).not.toContain(base.questions[0].options[0]);
      expect(html).not.toContain(base.questions[0].options[1]);
      expect(html).not.toContain("0%");
      expect(html).toContain("human review, not an automatic hiring decision");
    }
  );

  it.each(["submitted", "timed_out", "expired", "revoked"] as const)(
    "does not offer copy/revoke actions for a terminal %s attempt",
    status => {
      const html = render([{ ...base, status }]);
      expect(html).not.toContain('aria-label="Copy invitation link');
      expect(html).not.toContain('aria-label="Revoke invitation');
    }
  );

  it("shows a genuine final zero score, unanswered count, and distinct selected/correct answer labels", () => {
    const html = render([
      {
        ...base,
        status: "submitted",
        startedAtMs: 1000,
        submittedAtMs: 62000,
        score: {
          correct: 0,
          total: 2,
          answered: 1,
          unanswered: 1,
          percent: 0,
          topics: [
            {
              module: "Treatment",
              correct: 0,
              total: 2,
              answered: 1,
              percent: 0,
            },
          ],
        },
      },
    ]);
    expect(html).toContain("0 / 2 (0%)");
    expect(html).toContain("1 answered · 1 unanswered");
    expect(html).toContain("1m 1s");
    expect(html).toContain("Chosen fixture option");
    expect(html).toContain("Correct fixture option");
    expect(html).toContain("· Selected");
    expect(html).toContain("· Correct answer");
    expect(html).not.toContain(
      "Final scores and response review will be available"
    );
  });

  it("identifies revoked-after-completion results without hiding completion evidence", () => {
    const html = render([
      {
        ...base,
        status: "revoked",
        startedAtMs: 1000,
        submittedAtMs: 62000,
        score: {
          correct: 0,
          total: 2,
          answered: 1,
          unanswered: 1,
          percent: 0,
          topics: [
            {
              module: "Treatment",
              correct: 0,
              total: 2,
              answered: 1,
              percent: 0,
            },
          ],
        },
      },
    ]);
    expect(html).toContain("Revoked after completion");
    expect(html).toContain("0 / 2 (0%)");
    expect(html).toContain("1m 1s");
    expect(html).toContain("Completed:");
    expect(html).toContain("Chosen fixture option");
    expect(html).toContain("· Correct answer");
    expect(html).not.toContain('aria-label="Copy invitation link');
    expect(html).not.toContain('aria-label="Revoke invitation');
    expect(render([{ ...base, status: "revoked" }])).not.toContain(
      "Revoked after completion"
    );
  });

  it("escapes candidate-controlled strings rather than rendering markup", () => {
    const html = render([
      { ...base, candidateName: '<script>alert("fixture")</script>' },
    ]);
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
  });

  it("does not infer completion duration from expiry or clamp a missing start to epoch", () => {
    expect(recruitmentDuration(base)).toBe("—");
    expect(recruitmentDuration({ ...base, submittedAtMs: 5000 })).toBe("—");
    expect(
      recruitmentDuration({ ...base, startedAtMs: 0, submittedAtMs: 61000 })
    ).toBe("1m 1s");
    expect(
      recruitmentDuration({ ...base, startedAtMs: 5000, submittedAtMs: 4000 })
    ).toBe("0m 0s");
  });
});
