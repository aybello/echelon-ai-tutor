import { randomInt, randomUUID, createHash } from "node:crypto";
import { openSync, closeSync, readFileSync, fstatSync, lstatSync, realpathSync, constants } from "node:fs";
import { dirname, resolve, relative, isAbsolute, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { getCourseByKey, getAllActiveCourseKeys } from "../../../shared/courseRegistry";
import { interactiveModes, interactiveCatalogResponseSchema, interactiveSessionResponseSchema, type InteractiveCatalogResponse, type InteractiveDrillExample, type InteractiveMode, type InteractiveSessionResponse, type InteractiveStartSessionInput } from "../../../shared/interactiveSessions";
import { interactivePackageSchema, type InteractivePackage } from "../schema";
import { activeCheckedRelease, trustedApproval } from "../../../scripts/content-engine/trusted-corpora";
import { committedModeFitExclusions, committedReleaseExclusions, isReleaseExcluded, isExcludedFromMode, presentCauseEffect, type ModeFitExclusions } from "./modeFit";
import { compileOverlays, committedOverlayDocuments, overlaySchema, type ContentOverlay, type CourseOverlay, type OverlayItem } from "./overlay";
import { ENGINE_LIMITS, engineRegistrationSchema, engineManifestSchema, engineShardSchema, type ArtifactDescriptor, type EngineManifest, type EngineIndexEntry } from "./schema";

export class InteractiveEngineError extends Error {
  constructor() { super("Interactive content is unavailable."); this.name = "InteractiveEngineError"; }
}
const fail = (): never => { throw new InteractiveEngineError(); };
const hash = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");
const json = (value: unknown) => JSON.stringify(value);
// Fingerprint of the public runtime behavior sources, including this file with
// this constant normalized to zeros (see regression test). Changing behavior
// requires restamping it. It is not an approval of the effective release.
export const BEHAVIOR_POLICY_SHA256 = "828d7c7e32a658707f008dc01e532edd3e6427e26ef121928332ef45210c114a";
const canonical = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value !== null && typeof value === "object") return `{${Object.entries(value).filter(([, v]) => v !== undefined).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([k, v]) => `${json(k)}:${canonical(v)}`).join(",")}}`;
  return json(value);
};
/** Runtime identity only, separate from and not an approval of the base release.
 * Never hash checked manifest fields: the random trusted publicVersion is the
 * checked identity. Legacy version is the existing non-private wire identity. */
export function effectiveReleaseVersion(manifest: EngineManifest, documents: readonly ContentOverlay[], exclusions: ModeFitExclusions = committedModeFitExclusions(), behaviorPolicy = BEHAVIOR_POLICY_SHA256): string {
  const courseKey = manifest.courseKey;
  const base = manifest.classification === "legacy_plus_checked" ? manifest.publicVersion : manifest.version;
  if (!base) fail();
  const overlays = documents.map(doc => ({
    format: doc.format, overlayId: doc.overlayId, scope: doc.scope,
    additions: doc.additions.filter(item => item.courseKey === courseKey),
    replacements: doc.replacements.filter(item => item.courseKey === courseKey),
  })).filter(doc => doc.additions.length || doc.replacements.length);
  return `effective-${hash(canonical({ format: "interactive-effective-v2", courseKey, classification: manifest.classification, base, overlays,
    modeFit: { version: exclusions.version, mode: exclusions.mode, reason: exclusions.reason, ids: [...(exclusions.courses[courseKey] ?? [])].sort() },
    releaseExclusions: committedReleaseExclusions().groups.filter(group => group.courseKey === courseKey), behaviorPolicy,
  }))}`;
}
function freeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}
/** No cwd fallback or caller-controlled path. Source modules use source artifacts;
 * bundled dist/index.js uses its adjacent private interactive-content directory. */
export function resolveEngineRoot(moduleUrl = import.meta.url): string {
  const file = fileURLToPath(moduleUrl);
  if (/[/\\]server[/\\]interactiveContent[/\\]engine[/\\]loader\.(?:ts|js)$/.test(file)) return resolve(dirname(file), "release-v1");
  if (basename(file) === "index.js" && basename(dirname(file)) === "dist") return resolve(dirname(file), "interactive-content");
  throw new InteractiveEngineError();
}
type CacheEntry = { stamp: string; fingerprint: string; cost: number; value: unknown };
// One playable item: a verified stored entry, or a committed reviewed overlay item.
type Candidate = { id: string; mode: string; topicId: string; difficulty: string; bytes: number; stored?: EngineIndexEntry; overlay?: OverlayItem };
export class InteractiveContentEngine {
  private readonly root: string;
  private readonly cache = new Map<string, CacheEntry>();
  private cacheCost = 0;
  private diskReads = 0;
  private readonly overlays: ReadonlyMap<string, CourseOverlay>;
  private readonly overlayDocuments: readonly ContentOverlay[];
  /** Committed overlays have owner-authorized AI review; metadata alone is not a review receipt. */
  constructor(root: string = resolveEngineRoot(), overlays: readonly unknown[] = committedOverlayDocuments()) {
    this.root = resolve(root);
    this.overlayDocuments = freeze(overlays.map(document => overlaySchema.parse(document)));
    this.overlays = compileOverlays(this.overlayDocuments);
  }
  /** Test/build observability only; this is not returned by public procedures. */
  diagnostics() { return { diskReads: this.diskReads, cachedEntries: this.cache.size, cachedBytes: this.cacheCost }; }
  private path(file: string) {
    // Paths originate exclusively from canonical registrations and validated descriptors.
    if (!/^[a-z0-9][a-z0-9/-]*\.json$/.test(file) || file.includes("..")) fail();
    const path = resolve(this.root, file);
    const rel = relative(this.root, path);
    if (!rel || rel.startsWith("..") || isAbsolute(rel)) fail();
    // Reject symlinks at every component, including a substituted course directory.
    const realRoot = realpathSync(this.root);
    let parent = this.root;
    for (const component of rel.split(/[\/\\]/)) {
      parent = resolve(parent, component);
      const stat = lstatSync(parent);
      if (stat.isSymbolicLink()) fail();
    }
    if (realpathSync(path) !== resolve(realRoot, rel)) fail();
    return path;
  }
  private read<T>(file: string, limit: number, parse: (input: unknown) => T, descriptor?: ArtifactDescriptor, context = "", fresh = false): T {
    const path = this.path(file);
    const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW);
    try {
      const stat = fstatSync(fd);
      if (!stat.isFile() || stat.size < 1 || stat.size > limit || (descriptor && stat.size !== descriptor.bytes)) fail();
      const stamp = `${stat.ino}:${stat.size}:${stat.mtimeMs}:${stat.ctimeMs}`;
      const fingerprint = `${descriptor ? `${descriptor.bytes}:${descriptor.sha256}` : "registry"}:${context}`;
      const previous = this.cache.get(file);
      if (!fresh && previous?.stamp === stamp && previous.fingerprint === fingerprint) {
        this.cache.delete(file); this.cache.set(file, previous);
        return previous.value as T;
      }
      const content = readFileSync(fd);
      this.diskReads++;
      if (content.byteLength !== stat.size || content.byteLength > limit || (descriptor && hash(content) !== descriptor.sha256)) fail();
      // For checked resources, cache parsed objects only after authenticating the
      // current bytes against the trusted manifest chain, not filesystem metadata.
      if (fresh && descriptor && previous?.fingerprint === fingerprint) {
        this.cache.delete(file); this.cache.set(file, { ...previous, stamp });
        return previous.value as T;
      }
      if (previous) { this.cacheCost -= previous.cost; this.cache.delete(file); }
      const value = freeze(parse(JSON.parse(content.toString("utf8"))));
      // Conservative decoded-object accounting, not just file bytes.
      const cost = content.byteLength * 4;
      while (this.cache.size && (this.cache.size >= ENGINE_LIMITS.cacheEntries || this.cacheCost + cost > ENGINE_LIMITS.cacheBytes)) {
        const oldest = this.cache.keys().next().value!;
        this.cacheCost -= this.cache.get(oldest)!.cost; this.cache.delete(oldest);
      }
      if (cost <= ENGINE_LIMITS.cacheBytes) { this.cache.set(file, { stamp, fingerprint, cost, value }); this.cacheCost += cost; }
      return value;
    } finally { closeSync(fd); }
  }
  private guarded<T>(work: () => T): T {
    try { return work(); } catch { return fail(); }
  }
  private manifest(courseKey: string): EngineManifest | null {
    const course = getCourseByKey(courseKey);
    if (!course?.isActive || courseKey === "electrician-309a") fail();
    const registration = this.read("registry.json", ENGINE_LIMITS.registrationBytes, input => {
      const registry = engineRegistrationSchema.parse(input);
      const eligible = new Set(getAllActiveCourseKeys().filter(key => key !== "electrician-309a"));
      // This release registers every one of the canonical 38 eligible courses.
      // Deleting a registered entry is corruption, never an absent/legacy fallback.
      if (eligible.size !== 38 || Object.keys(registry.courses).length !== eligible.size) fail();
      for (const [key, descriptor] of Object.entries(registry.courses)) {
        if (!eligible.has(key) || descriptor.file !== `${key}/manifest.json` || descriptor.bytes > ENGINE_LIMITS.manifestBytes) fail();
      }
      if (registry.legacyMetadata.file !== "legacy-release-metadata.json" || registry.legacyMetadata.bytes > ENGINE_LIMITS.registrationBytes) fail();
      return registry;
    });
    const descriptor = registration.courses[courseKey];
    const pin = activeCheckedRelease(courseKey);
    if (!descriptor) return null;
    if (pin && descriptor.sha256 !== pin.manifestSha256) fail();
    return this.read(descriptor.file, ENGINE_LIMITS.manifestBytes, input => {
      const manifest = engineManifestSchema.parse(input);
      if (manifest.classification === "legacy_plus_checked") {
        const approval = trustedApproval(manifest.approvalId!);
        if (!pin || pin.approvalId !== manifest.approvalId || !approval || approval.releaseToken !== manifest.publicVersion || approval.checkedVersions[courseKey] !== manifest.version) fail();
      }
      if (pin && manifest.classification !== "legacy_plus_checked") fail();
      if (manifest.classification === "legacy_release" && manifest.version !== manifest.sourceVersion) fail();
      if (manifest.courseKey !== courseKey || manifest.legacy.file !== `${courseKey}/legacy.json` || manifest.legacy.bytes > ENGINE_LIMITS.legacyBytes) fail();
      const ids = new Set<string>();
      const positions = new Set<string>();
      const topics = new Set(manifest.topics.map(t => t.id));
      if (topics.size !== manifest.topics.length) fail();
      for (const [i, shard] of manifest.shards.entries()) {
        if (shard.file !== `${courseKey}/shard-${String(i).padStart(4, "0")}.json` || shard.bytes > ENGINE_LIMITS.shardBytes) fail();
      }
      for (const entry of manifest.entries) {
        const position = `${entry.shard}:${entry.offset}`;
        if (ids.has(entry.id) || positions.has(position) || !topics.has(entry.topicId) || !manifest.shards[entry.shard] || entry.offset >= manifest.shards[entry.shard].count) fail();
        ids.add(entry.id); positions.add(position);
      }
      if (manifest.shards.reduce((sum, shard) => sum + shard.count, 0) !== manifest.entries.length || new Set(Object.values(manifest.previewIds)).size !== 6) fail();
      for (const mode of interactiveModes) if (!manifest.entries.some(entry => entry.id === manifest.previewIds[mode] && entry.mode === mode)) fail();
      return manifest;
    }, descriptor, pin ? `checked:${pin.approvalId}:${pin.manifestSha256}` : "", !!pin);
  }
  private examples(manifest: EngineManifest, selected: EngineIndexEntry[]): InteractiveDrillExample[] {
    // Group reads so a request parses each selected shard only once even after LRU eviction.
    const result = new Map<string, InteractiveDrillExample>();
    const context = hash(json(manifest));
    for (const index of new Set(selected.map(entry => entry.shard))) {
      const descriptor = manifest.shards[index];
      const shard = this.read(descriptor.file, ENGINE_LIMITS.shardBytes, input => {
        const data = engineShardSchema.parse(input);
        if (data.courseKey !== manifest.courseKey || data.version !== manifest.version || data.examples.length !== descriptor.count) fail();
        const entries = manifest.entries.filter(entry => entry.shard === index);
        for (const entry of entries) {
          const example = data.examples[entry.offset];
          if (!example || example.id !== entry.id || example.mode !== entry.mode || Buffer.byteLength(json(example)) !== entry.bytes || hash(json(example)) !== entry.sha256) fail();
        }
        return data;
      }, descriptor, context, manifest.classification === "legacy_plus_checked");
      for (const entry of selected.filter(entry => entry.shard === index)) result.set(entry.id, shard.examples[entry.offset]);
    }
    return selected.map(entry => result.get(entry.id)!);
  }
  /** Shared effective view: exact-bound revisions, selected exclusions, then additions.
   * A stale revision fails closed instead of silently exposing its old target. */
  private pool(courseKey: string, manifest: EngineManifest): Candidate[] {
    const overlay = this.overlays.get(courseKey) ?? { additions: [], replacements: new Map() };
    const stored = new Map(manifest.entries.map(entry => [entry.id, entry]));
    for (const addition of overlay.additions) if (stored.has(addition.id)) fail();
    for (const [id, replacement] of overlay.replacements) {
      if (stored.get(id)?.sha256 !== replacement.sha256 || stored.has(replacement.item.id)) fail();
    }
    const candidates: Candidate[] = [];
    for (const entry of manifest.entries) {
      if (isExcludedFromMode(courseKey, entry.mode, entry.id)) continue;
      const replacement = overlay.replacements.get(entry.id)?.item;
      if (replacement && isExcludedFromMode(courseKey, replacement.mode, replacement.id)) continue;
      candidates.push(replacement ? { ...replacement, overlay: replacement } : { id: entry.id, mode: entry.mode, topicId: entry.topicId, difficulty: entry.difficulty, bytes: entry.bytes, stored: entry });
    }
    for (const addition of overlay.additions) if (!isExcludedFromMode(courseKey, addition.mode, addition.id)) candidates.push({ ...addition, overlay: addition });
    return candidates;
  }
  getCatalog(courseKey: string, hasAccess: boolean): InteractiveCatalogResponse {
    return this.guarded(() => {
      const manifest = this.manifest(courseKey);
      if (!manifest) return { courseKey, available: false, locked: !hasAccess, version: null, modes: [] };
      const pool = this.pool(courseKey, manifest);
      const modes = interactiveModes.map(mode => {
        const entries = pool.filter(entry => entry.mode === mode);
        return {
          mode, totalCount: entries.length,
          topics: manifest.topics.map(topic => ({ ...topic, count: entries.filter(entry => entry.topicId === topic.id).length })).filter(topic => topic.count > 0),
          difficulties: (["easy", "medium", "hard", "unclassified"] as const).map(id => ({ id, count: entries.filter(entry => entry.difficulty === id).length })).filter(d => d.count > 0),
        };
      });
      return interactiveCatalogResponseSchema.parse({ courseKey, available: true, locked: !hasAccess, version: effectiveReleaseVersion(manifest, this.overlayDocuments), modes });
    });
  }
  startSession(input: InteractiveStartSessionInput, hasAccess: boolean): InteractiveSessionResponse {
    return this.guarded(() => {
      const { courseKey, mode, sessionSize } = input;
      const manifest = this.manifest(courseKey);
      // Locked filters are syntactically validated by the wire input, then deliberately
      // ignored. Null resolved filters honestly describe the fixed preview selection.
      const filters = { topicId: hasAccess ? input.topicId ?? null : null, difficulty: hasAccess ? input.difficulty ?? null : null, requestedSize: sessionSize };
      const common = { courseKey, locked: !hasAccess, sessionId: randomUUID(), mode, filters };
      if (!manifest) return { ...common, available: false, version: null, totalAvailableCount: 0, examples: [] };
      const pool = this.pool(courseKey, manifest);
      const eligible = pool.filter(entry => entry.mode === mode && (filters.topicId === null || entry.topicId === filters.topicId) && (filters.difficulty === null || entry.difficulty === filters.difficulty));
      const previewId = manifest.previewIds[mode];
      const revisionId = this.overlays.get(courseKey)?.replacements.get(previewId)?.item.id;
      const storedPreview = manifest.entries.find(entry => entry.id === previewId && entry.mode === mode)!;
      // Preserve historical fixed calculation previews (mode-fit is a paid-pool rule),
      // but never bypass an exact safety exclusion or a bound correction.
      const preview = pool.find(entry => entry.id === (revisionId ?? previewId)) ??
        (!revisionId && !isReleaseExcluded(courseKey, mode, previewId) ? { id: storedPreview.id, mode, topicId: storedPreview.topicId, difficulty: storedPreview.difficulty, bytes: storedPreview.bytes, stored: storedPreview } : undefined);
      const totalAvailableCount = hasAccess ? eligible.length : preview ? 1 : 0;
      let selected: Candidate[];
      if (!hasAccess) selected = preview ? [preview] : [];
      else {
        // Partial Fisher-Yates: exact intersection, without replacement; no whole bank read.
        const candidates = [...eligible];
        selected = [];
        for (let i = 0; i < Math.min(sessionSize, candidates.length); i++) {
          const j = randomInt(i, candidates.length);
          [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
          selected.push(candidates[i]);
        }
      }
      // Keep a prefix of the random sample, never rotate/replace an oversized preview.
      let budget = ENGINE_LIMITS.responseBytes - 4096;
      let count = 0;
      for (const entry of selected) {
        if (entry.bytes + 1 > budget) break;
        budget -= entry.bytes + 1;
        count++;
      }
      selected = selected.slice(0, count);
      // Stored bytes are verified first; directional items are then presented with direction controls.
      const storedExamples = new Map(this.examples(manifest, selected.flatMap(entry => entry.stored ? [entry.stored] : [])).map(example => [example.id, example]));
      const examples = selected.map(entry => entry.overlay ? entry.overlay.example : storedExamples.get(entry.id)!).map(presentCauseEffect);
      const response = interactiveSessionResponseSchema.parse({ ...common, available: true, version: effectiveReleaseVersion(manifest, this.overlayDocuments), totalAvailableCount, examples });
      if (Buffer.byteLength(json(response)) > ENGINE_LIMITS.responseBytes) fail();
      return response;
    });
  }
  /** Compatibility stays bounded to legacy IDs, with the same revisions and exclusions; no additions or v2 bank. */
  getLegacyContent(courseKey: string, hasAccess: boolean) {
    return this.guarded(() => {
      const manifest = this.manifest(courseKey);
      if (!manifest) return { courseKey, available: false as const, locked: !hasAccess, version: null, examples: [] as InteractiveDrillExample[] };
      // Validate target bindings on compatibility requests too.
      this.pool(courseKey, manifest);
      const pkg: InteractivePackage = this.read(manifest.legacy.file, ENGINE_LIMITS.legacyBytes, input => {
        const legacy = interactivePackageSchema.parse(input);
        if (legacy.courseKey !== courseKey || legacy.version !== manifest.sourceVersion || hash(json(legacy)) !== manifest.sourceSha256 || json(legacy.previewIds) !== json(manifest.previewIds)) fail();
        return legacy;
      }, manifest.legacy, hash(json(manifest)), manifest.classification === "legacy_plus_checked");
      const previewIds = new Set(Object.values(pkg.previewIds));
      const revisions = this.overlays.get(courseKey)?.replacements;
      const effective = pkg.examples.filter(example => !isReleaseExcluded(courseKey, example.mode, example.id)).flatMap(example => {
        const revision = revisions?.get(example.id)?.item;
        return revision && isReleaseExcluded(courseKey, revision.mode, revision.id) ? [] : [{ originalId: example.id, example: revision?.example ?? example }];
      });
      const examples = effective.filter(row => hasAccess || previewIds.has(row.originalId)).map(row => row.example);
      const changed = effective.length !== pkg.examples.length || effective.some(row => row.originalId !== row.example.id);
      return { courseKey, available: true as const, locked: !hasAccess, version: changed ? effectiveReleaseVersion(manifest, this.overlayDocuments) : pkg.version, examples };

    });
  }
}
let defaultEngine: InteractiveContentEngine | undefined;
export const getInteractiveContentEngine = () => defaultEngine ??= new InteractiveContentEngine();
