import { hash } from './identity.mjs';
import { COURSES, MODES, VERSION } from './constants.mjs';
export const DEFAULT_PLAN = Object.freeze({
  schemaVersion: VERSION, pilotOnly: true, dryRun: true, provider: 'direct-google',
  catalogEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
  modelSelector: 'Carbon', maxItems: 6, batchSize: 2, maxSpendUSD: 1, maxRetries: 1,
  maxInputTokensPerBatch: 12000, maxOutputTokensPerBatch: 8000,
});
const int = (v, low, high) => Number.isSafeInteger(v) && v >= low && v <= high;
export function validatePlan(config) {
  const keys = [...Object.keys(DEFAULT_PLAN), 'courseKey', 'mode'];
  if (Object.keys(config).some(k => !keys.includes(k)) || config.schemaVersion !== VERSION || config.pilotOnly !== true || config.dryRun !== true || config.provider !== DEFAULT_PLAN.provider || config.catalogEndpoint !== DEFAULT_PLAN.catalogEndpoint || config.modelSelector !== 'Carbon') throw Error('offline-pilot-dry-run-direct-google-only');
  if (!COURSES.includes(config.courseKey) || !MODES.includes(config.mode)) throw Error('plan-course-mode-outside-scope');
  if (!int(config.maxItems, 1, 12) || !int(config.batchSize, 1, 4) || config.batchSize > config.maxItems || !int(config.maxRetries, 0, 2) || !int(config.maxInputTokensPerBatch, 1, 20000) || !int(config.maxOutputTokensPerBatch, 1, 12000) || !Number.isFinite(config.maxSpendUSD) || config.maxSpendUSD <= 0 || config.maxSpendUSD > 5) throw Error('pilot-resource-cap-exceeded');
  return config;
}
/** This function never fetches. The later authorized orchestrator must acquire the current Google catalog. */
export function selectCarbon(snapshot, now) {
  if (!Number.isFinite(Date.parse(now)) || snapshot?.provider !== 'direct-google' || snapshot?.endpoint !== DEFAULT_PLAN.catalogEndpoint || !snapshot?.response || snapshot.responseHash !== hash(snapshot.response)) throw Error('catalog-evidence-invalid');
  const age = Date.parse(now) - Date.parse(snapshot.retrievedAt);
  if (!Number.isFinite(age) || age < 0 || age > 24 * 60 * 60 * 1000) throw Error('fresh-direct-google-catalog-required');
  const matches = (snapshot.response.models ?? []).filter(m => /carbon/i.test(`${m.displayName ?? ''} ${m.name ?? ''}`) && /^models\/[a-zA-Z0-9._-]+$/.test(m.name) && m.supportedGenerationMethods?.includes('generateContent'));
  if (matches.length !== 1) throw Error('carbon-not-unambiguously-in-current-google-catalog');
  return matches[0];
}
function ledgerUsage(events, configHash, batches) {
  const attempts = new Map(); const completed = new Set(); let reservedMicros = 0;
  for (const event of events) {
    if (event.schemaVersion !== VERSION || event.configHash !== configHash || !batches.some(b => b.batchId === event.batchId) || !['reserved', 'completed', 'failed'].includes(event.status)) throw Error('ledger-config-or-event-mismatch');
    const current = attempts.get(event.batchId) ?? { number: 0, open: false };
    if (event.status === 'reserved') {
      if (current.open || completed.has(event.batchId) || event.attempt !== current.number + 1 || !int(event.reservedSpendMicros, 1, 5000000)) throw Error('ledger-reservation-invalid');
      reservedMicros += event.reservedSpendMicros;
      attempts.set(event.batchId, { number: event.attempt, open: true });
    } else {
      if (!current.open || event.attempt !== current.number) throw Error('ledger-terminal-without-reservation');
      attempts.set(event.batchId, { number: current.number, open: false });
      if (event.status === 'completed') completed.add(event.batchId);
    }
  }
  return { attempts, completed, reservedMicros };
}
export function planPilot(config, { catalog = null, pricing = null, events = [], now } = {}) {
  validatePlan(config);
  const configHash = hash(config);
  const batches = Array.from({ length: Math.ceil(config.maxItems / config.batchSize) }, (_, i) => ({
    batchId: `${configHash.slice(0,24)}-${i + 1}`, firstItem: i * config.batchSize,
    items: Math.min(config.batchSize, config.maxItems - i * config.batchSize),
  }));
  const usage = ledgerUsage(events, configHash, batches);
  if (catalog === null) return { schemaVersion: VERSION, configHash, dryRun: true, pilotOnly: true,
    status: 'blocked-awaiting-fresh-direct-google-carbon-catalog', catalogEndpoint: DEFAULT_PLAN.catalogEndpoint,
    callsMade: 0, batches, reservation: null };
  const model = selectCarbon(catalog, now);
  // Google model-list responses do not establish billing rates. Explicit documentary pricing is required.
  if (!pricing || pricing.modelName !== model.name || !pricing.evidence || !/^[a-f0-9]{64}$/.test(pricing.evidence.sha256) || !pricing.evidence.locator || !pricing.evidence.summary || ![pricing.inputUSDPerMillion, pricing.outputUSDPerMillion].every(v => Number.isFinite(v) && v > 0 && v <= 1000)) throw Error('explicit-bound-pricing-evidence-required');
  const reserveMicros = Math.ceil(config.maxInputTokensPerBatch * pricing.inputUSDPerMillion + config.maxOutputTokensPerBatch * pricing.outputUSDPerMillion);
  const capMicros = Math.floor(config.maxSpendUSD * 1000000);
  // Cost reservations bind catalog/pricing: a changed rate or model needs a new ledger.
  const executionHash = hash({ configHash, model, catalogResponseHash: catalog.responseHash, pricing });
  if (events.some(e => e.executionHash !== executionHash || (e.status === 'reserved' && e.reservedSpendMicros !== reserveMicros))) throw Error('ledger-model-pricing-binding-mismatch');
  if (usage.reservedMicros > capMicros || [...usage.attempts.values()].some(a => a.number > config.maxRetries + 1)) throw Error('ledger-budget-or-retry-cap-exceeded');
  const pending = batches.filter(b => !usage.completed.has(b.batchId));
  const stuck = pending.find(b => usage.attempts.get(b.batchId)?.open);
  let reservation = null;
  if (!stuck) {
    const next = pending.find(b => (usage.attempts.get(b.batchId)?.number ?? 0) < config.maxRetries + 1);
    if (next && usage.reservedMicros + reserveMicros <= capMicros) reservation = { schemaVersion: VERSION, configHash, executionHash,
      batchId: next.batchId, attempt: (usage.attempts.get(next.batchId)?.number ?? 0) + 1, status: 'reserved', reservedSpendMicros: reserveMicros };
  }
  return { schemaVersion: VERSION, configHash, executionHash, dryRun: true, pilotOnly: true, modelName: model.name,
    modelIdentity: 'direct-google-catalog-declared-not-independently-authenticated', callsMade: 0,
    status: stuck ? 'blocked-unresolved-reservation' : usage.completed.size === batches.length ? 'completed' : reservation ? 'dry-run-ready-no-generation' : 'blocked-budget-or-retry-cap',
    batches, completedBatchIds: [...usage.completed].sort(), reservedSpendMicros: usage.reservedMicros,
    worstCaseAllAttemptsMicros: batches.length * (config.maxRetries + 1) * reserveMicros, reservation };
}
