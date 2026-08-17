/**
 * Trade-agnostic certification program registry.
 *
 * Water and wastewater courses intentionally remain in courseRegistry.ts. That
 * registry encodes water-specific concepts (exam family, stream and Class 1-4
 * pricing). Regulated trades use this separate layer so a new trade cannot
 * accidentally become sellable or team-assignable through a water fallback.
 */

export type CertificationProgramLifecycle =
  | "internal_review"
  | "public_preview"
  | "closed_beta"
  | "commercial"
  | "retired";

export type CertificationBlueprintStatus =
  | "current_exam"
  | "in_development"
  | "superseded";

export type CertificationSourceUsage =
  | "public_official_reference"
  | "licensed_access_required";

export interface CertificationProgramSource {
  id: string;
  title: string;
  publisher: string;
  url: string | null;
  verifiedAt: string;
  usage: CertificationSourceUsage;
  approvedForQuestionAuthoring: boolean;
  notes: string;
}

export interface CertificationBlueprint {
  version: string;
  label: string;
  status: CertificationBlueprintStatus;
  effectiveFrom: string | null;
  verifiedAt: string;
  sourceIds: readonly string[];
}

export interface CertificationProgram {
  programKey: string;
  courseKey: string;
  bankKey: string;
  jurisdiction: {
    country: string;
    region: string;
    code: string;
  };
  trade: {
    name: string;
    credentialCode: string;
    redSeal: boolean;
  };
  lifecycle: CertificationProgramLifecycle;
  currentBlueprintVersion: string;
  blueprints: readonly CertificationBlueprint[];
  sources: readonly CertificationProgramSource[];
  launch: {
    publicPreviewApproved: boolean;
    publicDeliveryApproved: boolean;
    sellable: boolean;
    teamAssignable: boolean;
  };
}

export type CertificationQuestionReviewStatus =
  | "draft"
  | "in_review"
  | "approved"
  | "rejected";

export interface CertificationQuestionGovernance {
  programKey: string;
  blueprintVersion: string;
  sourceVerifiedAt: string;
  reviewStatus: CertificationQuestionReviewStatus;
  approvedForPractice: boolean;
  approvedForMock: boolean;
  retiredAt: string | null;
}

export type CertificationDeliverySurface = "practice" | "mock";

export const ELECTRICIAN_309A_PROGRAM_KEY =
  "construction-electrician-309a-on" as const;

export const ELECTRICIAN_309A_BLUEPRINT_VERSION =
  "red-seal-construction-electrician-current-previous-rsos-2026-08-15" as const;

export const ELECTRICIAN_309A_PROGRAM: CertificationProgram = {
  programKey: ELECTRICIAN_309A_PROGRAM_KEY,
  courseKey: "electrician-309a",
  bankKey: "electrician-309a",
  jurisdiction: {
    country: "Canada",
    region: "Ontario",
    code: "CA-ON",
  },
  trade: {
    name: "Electrician — Construction & Maintenance",
    credentialCode: "309A",
    redSeal: true,
  },
  lifecycle: "public_preview",
  currentBlueprintVersion: ELECTRICIAN_309A_BLUEPRINT_VERSION,
  blueprints: [
    {
      version: ELECTRICIAN_309A_BLUEPRINT_VERSION,
      label: "Current Construction Electrician exam — previous RSOS",
      status: "current_exam",
      effectiveFrom: null,
      verifiedAt: "2026-08-15",
      sourceIds: [
        "red-seal-trade-page",
        "red-seal-current-exam-weightings",
        "red-seal-exam-prep-guide",
        "skilled-trades-ontario-309a",
      ],
    },
  ],
  sources: [
    {
      id: "red-seal-trade-page",
      title: "Construction Electrician trade page",
      publisher: "Red Seal Program",
      url: "https://red-seal.ca/eng/trades/const-elect.shtml",
      verifiedAt: "2026-08-15",
      usage: "public_official_reference",
      approvedForQuestionAuthoring: true,
      notes:
        "Confirms the current exam remains based on the previous RSOS while exams for the newer standard are under development.",
    },
    {
      id: "red-seal-current-exam-weightings",
      title: "Construction Electrician examination weightings",
      publisher: "Red Seal Program",
      url: "https://red-seal.ca/eng/trades/constelectric/previous/exam-weightings.shtml",
      verifiedAt: "2026-08-15",
      usage: "public_official_reference",
      approvedForQuestionAuthoring: true,
      notes: "Canonical Major Work Activity and task weighting for the current exam.",
    },
    {
      id: "red-seal-exam-prep-guide",
      title: "Red Seal exam preparation guide",
      publisher: "Red Seal Program",
      url: "https://red-seal.ca/eng/resources/exam-prep-guide.shtml",
      verifiedAt: "2026-08-15",
      usage: "public_official_reference",
      approvedForQuestionAuthoring: true,
      notes: "Official exam-format and candidate-preparation guidance.",
    },
    {
      id: "skilled-trades-ontario-309a",
      title: "Electrician — Construction & Maintenance",
      publisher: "Skilled Trades Ontario",
      url: "https://www.skilledtradesontario.ca/trade-information/electrician-construction-and-maintenance/",
      verifiedAt: "2026-08-15",
      usage: "public_official_reference",
      approvedForQuestionAuthoring: true,
      notes: "Ontario credential, apprenticeship and trade-scope reference.",
    },
    {
      id: "canadian-electrical-code",
      title: "CSA C22.1 Canadian Electrical Code",
      publisher: "CSA Group",
      url: null,
      verifiedAt: "2026-08-15",
      usage: "licensed_access_required",
      approvedForQuestionAuthoring: false,
      notes:
        "Rule-number-specific content remains blocked until Echelon confirms legitimate licensed access and SME review.",
    },
  ],
  launch: {
    publicPreviewApproved: true,
    publicDeliveryApproved: false,
    sellable: false,
    teamAssignable: false,
  },
};

const CERTIFICATION_PROGRAMS = new Map<string, CertificationProgram>([
  [ELECTRICIAN_309A_PROGRAM.programKey, ELECTRICIAN_309A_PROGRAM],
]);

export function getCertificationProgram(
  programKey: string,
): CertificationProgram | undefined {
  return CERTIFICATION_PROGRAMS.get(programKey);
}

export function getCertificationPrograms(): readonly CertificationProgram[] {
  return Array.from(CERTIFICATION_PROGRAMS.values());
}

export function isCertificationQuestionPubliclyDeliverable(
  program: CertificationProgram,
  question: CertificationQuestionGovernance,
  surface: CertificationDeliverySurface,
): boolean {
  if (program.lifecycle !== "commercial") return false;
  if (!program.launch.publicDeliveryApproved) return false;
  if (question.programKey !== program.programKey) return false;
  if (question.blueprintVersion !== program.currentBlueprintVersion) return false;
  if (!question.sourceVerifiedAt) return false;
  if (question.reviewStatus !== "approved") return false;
  if (question.retiredAt !== null) return false;

  return surface === "practice"
    ? question.approvedForPractice
    : question.approvedForMock;
}

/**
 * A public preview is a limited, clearly labelled product demonstration. It is
 * deliberately separate from learner practice and mock delivery: it cannot
 * create an entitlement, become sellable, or be assigned to a Team.
 */
export function isCertificationQuestionPublicPreviewable(
  program: CertificationProgram,
  question: CertificationQuestionGovernance,
): boolean {
  if (program.lifecycle !== "public_preview") return false;
  if (!program.launch.publicPreviewApproved) return false;
  if (question.programKey !== program.programKey) return false;
  if (question.blueprintVersion !== program.currentBlueprintVersion) return false;
  if (!question.sourceVerifiedAt) return false;
  if (question.reviewStatus === "rejected") return false;
  return question.retiredAt === null;
}

export function selectCertificationQuestionsForPublicPreview<
  T extends CertificationQuestionGovernance,
>(questions: readonly T[], programKey: string): T[] {
  const program = getCertificationProgram(programKey);
  if (!program) return [];

  return questions.filter((question) =>
    isCertificationQuestionPublicPreviewable(program, question),
  );
}

/**
 * Public delivery fails closed. Unknown programs, review programs, stale
 * blueprint content and unapproved items all produce an empty result.
 */
export function selectCertificationQuestionsForPublicDelivery<
  T extends CertificationQuestionGovernance,
>(
  questions: readonly T[],
  programKey: string,
  surface: CertificationDeliverySurface,
): T[] {
  const program = getCertificationProgram(programKey);
  if (!program) return [];

  return questions.filter((question) =>
    isCertificationQuestionPubliclyDeliverable(program, question, surface),
  );
}

/**
 * Internal review deliberately allows draft and in-review content, but never
 * rejected, retired or stale-blueprint content. This selector must not be used
 * by learner inventory, commerce, readiness or Teams code paths.
 */
export function selectCertificationQuestionsForInternalReview<
  T extends CertificationQuestionGovernance,
>(questions: readonly T[], programKey: string): T[] {
  const program = getCertificationProgram(programKey);
  if (!program || program.lifecycle === "retired") return [];

  return questions.filter(
    (question) =>
      question.programKey === program.programKey &&
      question.blueprintVersion === program.currentBlueprintVersion &&
      question.reviewStatus !== "rejected" &&
      question.retiredAt === null,
  );
}
