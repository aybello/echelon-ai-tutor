import { createHash } from 'node:crypto';
export function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
  return value;
}
export const hash = value => createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
export const bytesHash = value => createHash('sha256').update(value).digest('hex');
// NFC, never compatibility folding or case folding: 2² != 22, ML != mL.
export const scientificText = value => typeof value === 'string' ? value.normalize('NFC').trim().replace(/\s+/gu, ' ') : value;
const sort = array => array.sort((a, b) => JSON.stringify(a) < JSON.stringify(b) ? -1 : JSON.stringify(a) > JSON.stringify(b) ? 1 : 0);
export function identity(item) {
  const problem = { mode: item.mode, prompt: scientificText(item.prompt), instruction: scientificText(item.instruction ?? '') };
  // Explanation wording, storage IDs and option order cannot create new coverage.
  // Instructions may carry quantities/equations, so never erase them. Rewordings
  // require explicit variant-family scrutiny rather than alleged semantic novelty.
  let answer;
  if (item.mode === 'speed-match') {
    problem.left = sort((item.pairs ?? []).map(p => scientificText(p.left)));
    problem.right = sort((item.pairs ?? []).map(p => scientificText(p.right)));
    answer = sort((item.pairs ?? []).map(p => [scientificText(p.left), scientificText(p.right)]));
  } else if (item.options?.length && typeof item.options[0] === 'object') {
    problem.options = sort(item.options.map(o => scientificText(o.label)));
    answer = scientificText(item.options.find(o => o.id === item.correctOptionId)?.label ?? null);
  } else {
    if (item.options) problem.options = sort(item.options.map(scientificText));
    answer = scientificText(item.correctAnswer ?? null);
  }
  return { problemHash: hash(problem), answerHash: hash(answer), exerciseHash: hash({ problem, answer }) };
}
export function subjectHash(exercise, document) {
  const { reviews, ...metadataAndPayload } = exercise;
  const conceptRefs = new Set(exercise.conceptRefs);
  const concepts = document.concepts.filter(c => conceptRefs.has(c.conceptId));
  const sourceRefs = [...exercise.sourceEvidenceRefs, ...exercise.authorityEvidence, ...concepts.flatMap(c => [...c.sourceEvidenceRefs, ...c.facts.flatMap(f => f.sourceEvidenceRefs)])];
  const sourceIds = new Set(sourceRefs.map(ref => ref.sourceId));
  return hash({ exercise: metadataAndPayload, concepts: sort(concepts.map(canonical)), sources: sort(document.sources.filter(s => sourceIds.has(s.sourceId)).map(canonical)) });
}
