/**
 * Reviewed against public WPI Class I wastewater notes on 2026-10-03.
 * Notes describe learning topics, not exclusive exam blueprint classifications.
 * Coverage rationale and source links: docs/audit-learning-taxonomy.md.
 */
export const WPI_CLASS1_WASTEWATER_NOTE_TOPICS: Readonly<Record<string, readonly string[]>> = {
  "Treatment Process": ["Primary & Secondary Treatment", "Solids Handling & Biosolids"],
  "Equipment Evaluation, Maintenance & Operation": ["Primary & Secondary Treatment", "Solids Handling & Biosolids", "Wastewater Collection Systems"],
  "Laboratory Analysis": ["Laboratory & Monitoring"],
  "Security, Safety & Administrative Procedures": ["Safety, Regulations & Admin"],
};
export function resolveStudyNotesTopics(courseKey: string | undefined, practiceModule: string | null | undefined, availableTopics: readonly string[]) {
  const available = [...new Set(availableTopics)];
  const recommendations = practiceModule && available.includes(practiceModule)
    ? [practiceModule]
    : courseKey === "wpi-class1-wastewater" && practiceModule
      ? [...(WPI_CLASS1_WASTEWATER_NOTE_TOPICS[practiceModule] ?? [])].filter(topic => available.includes(topic))
      : [];
  return {
    recommendedTopics: recommendations,
    // A multi-topic module opens the chooser, never an arbitrary first topic.
    initialTopic: recommendations.length === 1 ? recommendations[0] : null,
    topics: [...recommendations, ...available.filter(topic => !recommendations.includes(topic))],
  };
}
/** A cached/selected note key may disappear when the independent payload reloads. */
export function availableStudyNote(selectedTopic: string | null, availableTopics: readonly string[]) {
  return selectedTopic && availableTopics.includes(selectedTopic) ? selectedTopic : null;
}
