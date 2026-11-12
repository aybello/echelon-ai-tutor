// Conservative discovery/exclusion rules, not legal advice or expert review.
// Inspect all learner-visible original fields, including distractors and pair labels.
// Source URLs are signals, not independently sufficient to exclude a neutral fact.
const authority = /\b(?:osha|o\.?\s*reg\.?\s*\d|ontario regulation|regulations?|regulatory|legislation|statutory|statute|legal(?:ly)?|\d+\s*cfr|tceq|sdwa|compliance|noncompliance|jurisdiction(?:al)?|mandat(?:e|ed|ory)|law(?:s)?|permit[ -]space)\b/i;
const lawReference = /\b(?:section|schedule)\s+\d+(?:\.\d+)*\b/i;
const safetyDuty = /\b(?:confined.space.{0,40}requires?|isolation must|authori[sz]ed workers? must|competent person|authori[sz]ed (?:employee|entrant)|entry supervisor|entry permit|rescue must|rescuers? (?:must|requires?)|must (?:also )?(?:be )?(?:controlled|assess|inspect|verif|isolate)|energy.control procedure|lockout|lock.out|tagout|tag.out)\b/i;
const dutySource = /osha\.gov|ccohs\.ca\/oshanswers\/(?:hsprograms|safety_haz)|ontario\.ca\/(?:laws|page\/(?:confined|watermain-disinfection-procedure))/i;
const manualIds = new Set([
  'wpi-class2-water-dist-063', 'wpi-class1-water-coll-044',
  'wpi-class4-water-dist-015', 'wpi-class2-water-dist-015',
  'wpi-class4-water-dist-order-015', 'wqa-087',
]);
export function legalScreen(item) {
  const text = JSON.stringify({ prompt: item.prompt, options: item.options, answer: item.answer, pairs: item.pairs, explanation: item.explanation });
  const sources = (item.sources || []).join(' ');
  const reasons = [];
  if (authority.test(text)) reasons.push('legal-or-authority-language');
  if (lawReference.test(text) && dutySource.test(sources)) reasons.push('numbered-section-and-regulatory-source');
  if (/\b(?:required|applicable)\s+CT\b/i.test(text)) reasons.push('claimed-required-disinfection-ct');
  if (/\b(?:CCOHS|OSHA)\b[\s\S]{0,100}\b(?:lockout|lock.out|permit|confined.space)\b|\b(?:lockout|lock.out|permit|confined.space)\b[\s\S]{0,100}\b(?:CCOHS|OSHA)\b/i.test(text)) reasons.push('named-safety-program-sequence');
  if (safetyDuty.test(text) && dutySource.test(sources)) reasons.push('source-linked-safety-duty-or-sequence');
  if (manualIds.has(item.id)) reasons.push('manual-flagged-item');
  // The answer and explanation imply mandatory backflow protection under an
  // applicable standard, without a verified jurisdiction-specific authority.
  if (item.id === 'class1-water-dist-074') reasons.push('unverified-mandatory-backflow-standard-claim');
  return reasons;
}
