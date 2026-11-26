import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import electricianQuestions from "./private/electrician309aDraftQuestions";
import {
  ELECTRICIAN_309A_BLUEPRINT_VERSION,
  ELECTRICIAN_309A_PROGRAM,
  ELECTRICIAN_309A_PROGRAM_KEY,
  getCertificationProgram,
  isCertificationQuestionPubliclyDeliverable,
  isCertificationQuestionPublicPreviewable,
  canApproveCertificationReview,
  isCertificationContentBetaDeliverable,
  selectCertificationContentForBeta,
  selectCertificationQuestionsForInternalReview,
  selectCertificationQuestionsForPublicDelivery,
  selectCertificationQuestionsForPublicPreview,
  type CertificationProgram,
  type CertificationQuestionGovernance,
  type CertificationBankVersionGovernance,
  type GovernedCertificationContent,
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

  it("keeps 309A as a free governed beta but unavailable to commerce or Teams", () => {
    expect(ELECTRICIAN_309A_PROGRAM.lifecycle).toBe("closed_beta");
    expect(ELECTRICIAN_309A_PROGRAM.launch).toEqual({
      publicPreviewApproved: true,
      publicDeliveryApproved: true,
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

  it("serves the 25 draft questions only through the approved preview or internal review paths", () => {
    expect(
      selectCertificationQuestionsForPublicPreview(
        electricianQuestions,
        ELECTRICIAN_309A_PROGRAM_KEY,
      ),
    ).toHaveLength(25);
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

  it("keeps a public preview separate from commercial learner delivery", () => {
    const question = electricianQuestions[0];
    expect(isCertificationQuestionPublicPreviewable(ELECTRICIAN_309A_PROGRAM, question)).toBe(true);
    expect(
      isCertificationQuestionPubliclyDeliverable(
        ELECTRICIAN_309A_PROGRAM,
        question,
        "practice",
      ),
    ).toBe(false);
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

  it("keeps draft 309A questions out of the public browser bundle", () => {
    const appSource = readFileSync(resolve(process.cwd(), "client/src/App.tsx"), "utf8");
    const practiceSource = readFileSync(resolve(process.cwd(), "client/src/pages/Electrician309APractice.tsx"), "utf8");
    const adapterSource = readFileSync(resolve(process.cwd(), "client/src/hooks/useElectrician309ABank.ts"), "utf8");
    const reviewRouterSource = readFileSync(resolve(process.cwd(), "server/routers/electricianReviewRouter.ts"), "utf8");
    const siteNavSource = readFileSync(resolve(process.cwd(), "client/src/components/SiteNav.tsx"), "utf8");

    expect(appSource).toContain("Electrician309APractice");
    expect(appSource).not.toContain("Electrician309ADemo");
    expect(appSource).not.toContain("/electrician-309a-demo");
    expect(appSource).toContain('/electrician-309a');
    expect(practiceSource).toContain("useElectrician309ABank");
    expect(adapterSource).toContain("trpc.electricianReview.get309ABetaPractice.useQuery(");
    expect(practiceSource).not.toContain("electrician309aDraftQuestions");
    expect(reviewRouterSource).toContain("adminProcedure.query");
    expect(reviewRouterSource).toContain("selectCertificationQuestionsForInternalReview");
    expect(reviewRouterSource).toContain("publicProcedure.query");
    expect(reviewRouterSource).toContain("selectCertificationQuestionsForPublicPreview");
    expect(reviewRouterSource).toContain("get309ABetaPractice");
    expect(reviewRouterSource).toContain('contentStatus, "beta_approved"');
    expect(siteNavSource).toContain("309A Electrician");
    expect(siteNavSource).toContain("/electrician-309a");
  });

  it("fails closed unless the governed free-beta release gates all pass", () => {
    expect(ELECTRICIAN_309A_PROGRAM.lifecycle).toBe("closed_beta");
    expect(ELECTRICIAN_309A_PROGRAM.launch.publicDeliveryApproved).toBe(true);
    const bank: CertificationBankVersionGovernance = {
      programKey: ELECTRICIAN_309A_PROGRAM_KEY,
      bankKey: "electrician-309a",
      versionKey: "309a-current-rsos-v2",
      blueprintVersion: ELECTRICIAN_309A_BLUEPRINT_VERSION,
      releaseChannel: "beta",
      active: true,
      commercialEligibility: false,
      teamEligibility: false,
      retiredAt: null,
    };
    const item: GovernedCertificationContent = {
      programKey: ELECTRICIAN_309A_PROGRAM_KEY,
      blueprintVersion: ELECTRICIAN_309A_BLUEPRINT_VERSION,
      sourceId: "red-seal-current-exam-weightings",
      contentStatus: "beta_approved",
      publicEligibility: true,
      retiredAt: null,
    };
    const source = ELECTRICIAN_309A_PROGRAM.sources.find(
      (candidate) => candidate.id === item.sourceId,
    );

    expect(isCertificationContentBetaDeliverable(ELECTRICIAN_309A_PROGRAM, bank, item, source)).toBe(true);
    expect(isCertificationContentBetaDeliverable(ELECTRICIAN_309A_PROGRAM, { ...bank, releaseChannel: "internal" }, item, source)).toBe(false);
    expect(isCertificationContentBetaDeliverable(ELECTRICIAN_309A_PROGRAM, bank, { ...item, contentStatus: "draft" }, source)).toBe(false);
    expect(isCertificationContentBetaDeliverable(ELECTRICIAN_309A_PROGRAM, bank, { ...item, sourceId: "canadian-electrical-code" }, ELECTRICIAN_309A_PROGRAM.sources.find((candidate) => candidate.id === "canadian-electrical-code"))).toBe(false);
    expect(selectCertificationContentForBeta([item, { ...item, contentStatus: "technical_approved" }], ELECTRICIAN_309A_PROGRAM_KEY, bank, ELECTRICIAN_309A_PROGRAM.sources)).toEqual([item]);
  });

  it("requires a second Echelon reviewer for technical and beta approval", () => {
    expect(canApproveCertificationReview("codex", "codex", "editorial")).toBe(true);
    expect(canApproveCertificationReview("codex", "codex", "technical")).toBe(false);
    expect(canApproveCertificationReview("codex", "claude", "technical")).toBe(true);
    expect(canApproveCertificationReview("codex", "manus", "beta_release")).toBe(true);
    expect(canApproveCertificationReview("codex", "CODEX", "beta_release")).toBe(false);
  });
});
