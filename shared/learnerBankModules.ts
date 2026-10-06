/**
 * Ensures learner-visible module filters are backed by at least one current
 * question row. Metadata can become stale after a bank import or repair; when
 * that happens, returning its labels creates filters that always lead to an
 * empty practice session.
 */
export function reconcileLearnerBankModules(
  metadataModules: readonly string[],
  storedQuestionModules: readonly string[],
): string[] {
  const unique = (values: readonly string[]) =>
    [...new Set(values.filter((value) => value.trim().length > 0))];

  const stored = unique(storedQuestionModules);
  // An empty learner-visible bank must not offer filters that cannot return a
  // question. Callers can use the empty list to show their ordinary empty-bank
  // state instead.
  if (stored.length === 0) return [];

  const storedSet = new Set(stored);
  const metadata = unique(metadataModules);

  // Preserve a curated metadata order only when every displayed module is
  // available in the active learner-visible question bank.
  if (metadata.length > 0 && metadata.every((module) => storedSet.has(module))) {
    return metadata;
  }

  // A mismatch must fail safe for learners: only expose real question modules.
  return stored;
}
