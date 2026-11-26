// Synthetic test declarations only; not evidence of any real content review.
import { batchSha256, canonicalSha256, educationalSha256, CHECKS } from "./reviewReceipt";
import type { ContentOverlay } from "./overlay";
export function syntheticReceipt(doc: ContentOverlay): ContentOverlay {
  const registeredAt = "2026-11-13T00:00:00Z", model = "Synthetic fixture";
  const entries = [...doc.additions, ...doc.replacements];
  const declaration = { reviewAuthority: "owner-authorized-ai-review" as const, model, reviewedAt: null, attestation: "Synthetic test only", payloadSha256: Object.fromEntries(entries.map(e => [e.example.id, educationalSha256(e)])) };
  const builderResults = { checks: CHECKS.slice() as [...typeof CHECKS], errors: [], stats: { swipe: { t: 0, f: 0 }, dirs: { increase: 0, decrease: 0, unchanged: 0 }, longest: 0, options: 0 }, batchSha256: batchSha256(doc) };
  const bind = <T extends (typeof entries)[number]>(e: T) => ({ ...e, review: { verdict: "approved" as const, reviewer: model, model, reviewAuthority: declaration.reviewAuthority, reviewedAt: null, registeredAt, notes: declaration.attestation, payloadSha256: educationalSha256(e), builderResultsSha256: canonicalSha256(builderResults) } });
  return { ...doc, format: "interactive-overlay-v2", additions: doc.additions.map(bind), replacements: doc.replacements.map(bind), receipt: { declaration, registeredAt, builderResults } } as ContentOverlay;
}
