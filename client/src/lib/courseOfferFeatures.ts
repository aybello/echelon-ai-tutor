import { formatQuestionBankAccessFeature } from "./questionBankInventory";

const DEFAULT_OFFER_FEATURES = [
  "Timed mock exam",
  "AI Tutor explanations on every question",
  "Score history & module breakdown",
];

/**
 * Replaces the inventory claim at the top of a course offer with the current
 * bank metadata. Static page copy can otherwise drift as banks grow.
 */
export function buildAuthoritativeOfferFeatures(input: {
  courseLabel: string;
  totalQuestions?: number | null;
  suppliedFeatures?: string[];
}): string[] {
  const suppliedFeatures = input.suppliedFeatures ?? DEFAULT_OFFER_FEATURES;
  const tail = suppliedFeatures.filter((feature, index) => {
    if (index > 0) return true;

    const normalizedFeature = feature.toLowerCase();
    return !(normalizedFeature.includes("question") && normalizedFeature.includes("unlimited attempts"));
  });

  return [
    formatQuestionBankAccessFeature(input.courseLabel, input.totalQuestions ?? 0),
    ...tail,
  ];
}
