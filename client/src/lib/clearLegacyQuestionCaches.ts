/** Remove historical answer-bearing caches without touching login or progress. */
export function clearLegacyQuestionCaches(storage: Storage): void {
  const keys = Array.from({ length: storage.length }, (_, i) => storage.key(i));
  for (const key of keys) if (key?.startsWith("echelon_qbank_")) storage.removeItem(key);
}
