import { describe, expect, it } from "vitest";
import electricianQuestions from "../client/src/lib/electrician309aDraftQuestions";
import {
  ELECTRICIAN_309A_BLUEPRINT_VERSION,
  ELECTRICIAN_309A_PROGRAM,
  ELECTRICIAN_309A_PROGRAM_KEY,
  getCertificationProgram,
  isCertificationQuestionPubliclyDeliverable,
  selectCertificationQuestionsForInternalReview,
  selectCertificationQuestionsForPublicDelivery,
  type CertificationProgram,
  type CertificationQuestionGovernance,
} from "../shared/certificationPrograms";

function commercialProgram(): CertificationProgram {
  return {
    ...ELECTRICIAN_309A_PROGRAM,
    lifecycle: "commercial",
    launch: {
      ...ELECTRICIAN_309A_PROGRAM.launch,
      publicDeliveryApproved: true,
    },
  };
}

function approvedQuestion(): CertificationQuestionGovernance {
  return {
    programKey: ELECTRICIAN_309A_PROGRAM_KEY,
    blueprintVersion: ELECTRICIAN_309A_BLUEPRINT_VERSION,
    sourceVerifiedAt: "2026-08-15",
    reviewStatus: "approved",
    approvedForPractice: true,
    approvedForMock: true,
    retiredAt: null,
  };
}

describe("trade-agnostic certification program foundation", () => {
  it("registers 309A separately from the water course registry", () => {
    const program = getCertificationProgram(ELECTRICIAN_309A_PROGRAM_KEY);

    expect(program?.trade.credentialCode).toBe("309A");
    expect(program?.jurisdiction.code).toBe("CA-ON");
    expect(program?.currentBlueprintVersion).toBe(
      ELECTRICIAN_309A_BLUEPRINT_VERSION,
    );
  });

  it("keeps 309A review-only and unavailable to commerce or Teams", () => {
    expect(ELECTRICIAN_309A_PROGRAM.lifecycle).toBe("internal_review");
    expect(ELECTRICIAN_309A_PROGRAM.launch).toEqual({
      publicDeliveryApproved: false,
      sellable: false,
      teamAssignable: false,
    });
  });

  it("records official sources and blocks unlicensed code authoring", () => {
    const codeSource = ELECTRICIAN_309A_PROGRAM.sources.find(
      (source) => source.id === "canadian-electrical-code",
    );

    expect(ELECTRICIAN_309A_PROGRAM.sources.length).toBeGreaterThanOrEqual(5);
    expect(codeSource?.usage).toBe("licensed_access_required");
    expect(codeSource?.approvedForQuestionAuthoring).toBe(false);
  });

  it("serves the 25 draft questions only through internal review", () => {
    expect(
      selectCertificationQuestionsForInternalReview(
        electricianQuestions,
        ELECTRICIAN_309A_PROGRAM_KEY,
      ),
    ).toHaveLength(25);
    expect(
      selectCertificationQuestionsForPublicDelivery(
        electricianQuestions,
        ELECTRICIAN_309A_PROGRAM_KEY,
        "practice",
      ),
    ).toHaveLength(0);
    expect(
      selectCertificationQuestionsForPublicDelivery(
        electricianQuestions,
        ELECTRICIAN_309A_PROGRAM_KEY,
        "mock",
      ),
    ).toHaveLength(0);
  });

  it("requires every public-delivery gate to pass", () => {
    const program = commercialProgram();
    const question = approvedQuestion();

    expect(
      isCertificationQuestionPubliclyDeliverable(
        program,
        question,
        "practice",
      ),
    ).toBe(true);

    expect(
      isCertificationQuestionPubliclyDeliverable(
        { ...program, lifecycle: "closed_beta" },
        question,
        "practice",
      ),
    ).toBe(false);
    expect(
      isCertificationQuestionPubliclyDeliverable(
        {
          ...program,
          launch: { ...program.launch, publicDeliveryApproved: false },
        },
        question,
        "practice",
      ),
    ).toBe(false);
    expect(
      isCertificationQuestionPubliclyDeliverable(
        program,
        { ...question, blueprintVersion: "superseded" },
        "practice",
      ),
    ).toBe(false);
    expect(
      isCertificationQuestionPubliclyDeliverable(
        program,
        { ...question, reviewStatus: "in_review" },
        "practice",
      ),
    ).toBe(false);
    expect(
      isCertificationQuestionPubliclyDeliverable(
        program,
        { ...question, approvedForPractice: false },
        "practice",
      ),
    ).toBe(false);
    expect(
      isCertificationQuestionPubliclyDeliverable(
        program,
        { ...question, approvedForMock: false },
        "mock",
      ),
    ).toBe(false);
    expect(
      isCertificationQuestionPubliclyDeliverable(
        program,
        { ...question, retiredAt: "2026-08-16" },
        "practice",
      ),
    ).toBe(false);
  });

  it("never exposes rejected, retired or stale content to internal review", () => {
    const current = electricianQuestions[0];
    const candidates = [
      current,
      { ...current, id: 999001, reviewStatus: "rejected" as const },
      { ...current, id: 999002, retiredAt: "2026-08-16" },
      { ...current, id: 999003, blueprintVersion: "superseded" },
    ];

    const visible = selectCertificationQuestionsForInternalReview(
      candidates,
      ELECTRICIAN_309A_PROGRAM_KEY,
    );

    expect(visible.map((question) => question.id)).toEqual([current.id]);
  });
});
