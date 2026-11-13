import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, lstatSync } from "node:fs";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { getAllActiveCourseKeys, getCourseByKey } from "../../../shared/courseRegistry";
import { interactiveModes, type InteractiveDrillExample, type InteractiveDifficulty } from "../../../shared/interactiveSessions";
import { interactivePackageSchema, type InteractivePackage } from "../schema";
import { ENGINE_LIMITS, engineExampleSchema, engineManifestSchema, engineRegistrationSchema, engineShardSchema, type ArtifactDescriptor, type EngineManifest } from "./schema";

export const digest = (data: string | Buffer) => createHash("sha256").update(data).digest("hex");
export const canonicalJson = (data: unknown) => JSON.stringify(data);
const encode = (data: unknown) => `${canonicalJson(data)}\n`;
export const eligibleCourseKeys = () => getAllActiveCourseKeys().filter(key => key !== "electrician-309a").sort();
function canonicalCourse(courseKey: string) {
  const course = getCourseByKey(courseKey);
  if (!course?.isActive || courseKey === "electrician-309a") throw new Error("Course is not eligible for interactive artifacts");
}
function artifact(root: string, file: string, data: unknown, limit: number): ArtifactDescriptor {
  const content = encode(data);
  if (Buffer.byteLength(content) > limit) throw new Error("Interactive artifact byte limit exceeded");
  const path = join(root, file);
  mkdirSync(resolve(path, ".."), { recursive: true });
  writeFileSync(path, content, { mode: 0o600 });
  return { file, sha256: digest(content), bytes: Buffer.byteLength(content) };
}
export type ClassifiedExample = { example: InteractiveDrillExample; topicId: string; difficulty: InteractiveDifficulty };
/** Pure artifact compilation; classifications must be supplied, never inferred. */
export function compileCourse(root: string, legacyInput: unknown, records?: ClassifiedExample[], topics = [{ id: "unclassified", label: "Unclassified" }]): ArtifactDescriptor {
  const legacy = interactivePackageSchema.parse(legacyInput);
  canonicalCourse(legacy.courseKey);
  const rows = records ?? legacy.examples.map(example => ({ example, topicId: "unclassified", difficulty: "unclassified" as const }));
  if (!rows.length || rows.length > ENGINE_LIMITS.maxCourseItems) throw new Error("Invalid course item count");
  const ids = new Set<string>();
  const entries: EngineManifest["entries"] = [];
  const shards: EngineManifest["shards"] = [];
  const version = legacy.version;
  const sourceSha256 = digest(canonicalJson(legacy));
  let batch: InteractiveDrillExample[] = [];
  const flush = () => {
    if (!batch.length) return;
    const file = `${legacy.courseKey}/shard-${String(shards.length).padStart(4, "0")}.json`;
    const shard = engineShardSchema.parse({ format: "interactive-shard-v1", courseKey: legacy.courseKey, version, examples: batch });
    shards.push({ ...artifact(root, file, shard, ENGINE_LIMITS.shardBytes), count: batch.length });
    batch = [];
  };
  for (const row of rows) {
    const example = engineExampleSchema.parse(row.example);
    if (ids.has(example.id)) throw new Error("Duplicate course item id");
    ids.add(example.id);
    const bytes = Buffer.byteLength(canonicalJson(example));
    if (bytes > ENGINE_LIMITS.exampleBytes) throw new Error("Interactive example byte limit exceeded");
    const candidateBytes = Buffer.byteLength(encode({ format: "interactive-shard-v1", courseKey: legacy.courseKey, version, examples: [...batch, example] }));
    if (batch.length === ENGINE_LIMITS.shardItems || candidateBytes > ENGINE_LIMITS.shardBytes) flush();
    entries.push({ id: example.id, mode: example.mode, topicId: row.topicId, difficulty: row.difficulty, shard: shards.length, offset: batch.length, bytes, sha256: digest(canonicalJson(example)) });
    batch.push(example);
  }
  flush();
  // Preserve each exact fixed preview, including its payload, not just its id.
  for (const mode of interactiveModes) {
    const original = legacy.examples.find(example => example.id === legacy.previewIds[mode])!;
    const row = rows.find(record => record.example.id === legacy.previewIds[mode]);
    if (!row || row.example.mode !== mode || canonicalJson(engineExampleSchema.parse(row.example)) !== canonicalJson(original)) throw new Error("Fixed legacy preview changed");
  }
  const topicIds = new Set(topics.map(t => t.id));
  if (topicIds.size !== topics.length || entries.some(e => !topicIds.has(e.topicId))) throw new Error("Invalid topic classification");
  const legacyDescriptor = artifact(root, `${legacy.courseKey}/legacy.json`, legacy, ENGINE_LIMITS.legacyBytes);
  const manifest = engineManifestSchema.parse({
    format: "interactive-course-v1", courseKey: legacy.courseKey, version, classification: "legacy_release",
    sourceVersion: legacy.version, sourceSha256, previewIds: legacy.previewIds, topics, legacy: legacyDescriptor, shards, entries,
  });
  return artifact(root, `${legacy.courseKey}/manifest.json`, manifest, ENGINE_LIMITS.manifestBytes);
}

/** Build-time only: parse the frozen registry as data; never import or evaluate it. */
function approvedLegacyRegistrations(registry: string): string[] {
  function invalid(): never { throw new Error("Invalid or unapproved legacy release registration"); }
  const source = ts.createSourceFile("registry.ts", registry, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  // TypeScript exposes parser diagnostics on SourceFile at runtime, but not in its public type.
  if ((source as ts.SourceFile & { parseDiagnostics: readonly ts.Diagnostic[] }).parseDiagnostics.length) invalid();
  const imports = new Map<string, string>();
  const importedCourses = new Set<string>();
  let registration: ts.ObjectLiteralExpression | undefined;
  for (const statement of source.statements) {
    if (ts.isImportDeclaration(statement)) {
      const clause = statement.importClause;
      if (registration || statement.modifiers?.length || statement.attributes || !clause || clause.isTypeOnly || !clause.name || clause.namedBindings || !/^p\d+$/.test(clause.name.text) || !ts.isStringLiteral(statement.moduleSpecifier)) invalid();
      const match = /^\.\/packages\/([a-z0-9-]+)\.json$/.exec(statement.moduleSpecifier.text);
      if (!match || imports.has(clause.name.text) || importedCourses.has(match[1])) invalid();
      imports.set(clause.name.text, match[1]);
      importedCourses.add(match[1]);
      continue;
    }
    if (!ts.isVariableStatement(statement) || registration || statement.modifiers?.length !== 1 || statement.modifiers[0].kind !== ts.SyntaxKind.ExportKeyword || statement.declarationList.flags !== ts.NodeFlags.Const || statement.declarationList.declarations.length !== 1) invalid();
    const declaration = statement.declarationList.declarations[0];
    if (!ts.isIdentifier(declaration.name) || declaration.name.text !== "releasePackages") invalid();
    const initializer = declaration.initializer;
    if (!initializer || !ts.isCallExpression(initializer) || initializer.questionDotToken || initializer.typeArguments?.length || !ts.isPropertyAccessExpression(initializer.expression) || initializer.expression.questionDotToken || !ts.isIdentifier(initializer.expression.expression) || initializer.expression.expression.text !== "Object" || initializer.expression.name.text !== "freeze" || initializer.arguments.length !== 1 || !ts.isObjectLiteralExpression(initializer.arguments[0])) invalid();
    registration = initializer.arguments[0];
  }
  if (!registration) invalid();
  const approved = new Set<string>();
  for (const property of registration.properties) {
    if (!ts.isPropertyAssignment(property) || !ts.isStringLiteral(property.name) || approved.has(property.name.text) || !ts.isObjectLiteralExpression(property.initializer)) invalid();
    const key = property.name.text;
    const fields = new Map<string, ts.Expression>();
    for (const field of property.initializer.properties) {
      if (!ts.isPropertyAssignment(field) || !(ts.isIdentifier(field.name) || ts.isStringLiteral(field.name))) invalid();
      const name = field.name.text;
      if ((name !== "approved" && name !== "content") || fields.has(name)) invalid();
      fields.set(name, field.initializer);
    }
    const content = fields.get("content");
    if (fields.size !== 2 || fields.get("approved")?.kind !== ts.SyntaxKind.TrueKeyword || !content || !ts.isIdentifier(content) || imports.get(content.text) !== key) invalid();
    approved.add(key);
  }
  if (approved.size !== imports.size) invalid();
  return [...approved].sort();
}

/** Reads JSON and exact literal registration AST, never executes/imports release scripts or the whole catalog. */
export function compileLegacyRelease(options: { sourceDir?: string; outputDir?: string } = {}) {
  const engineDir = fileURLToPath(new URL(".", import.meta.url));
  const sourceDir = options.sourceDir ?? resolve(engineDir, "../release-2026-11-12");
  const outputDir = options.outputDir ?? resolve(engineDir, "release-v1");
  const registry = readFileSync(join(sourceDir, "registry.ts"), "utf8");
  const metadataBytes = readFileSync(join(sourceDir, "release-metadata.json"));
  const metadata = JSON.parse(metadataBytes.toString("utf8"));
  const approved = approvedLegacyRegistrations(registry);
  const canonical = eligibleCourseKeys();
  if (canonicalJson(approved) !== canonicalJson(canonical) || approved.length !== 38 || metadata.counts?.courses !== 38 || metadata.courses?.length !== 38) throw new Error("Approved legacy registration must match the 38 canonical eligible courses");
  mkdirSync(outputDir, { recursive: true });
  const courses: Record<string, ArtifactDescriptor> = {};
  let itemCount = 0;
  for (const key of approved) {
    const path = join(sourceDir, "packages", `${key}.json`);
    if (!lstatSync(path).isFile() || lstatSync(path).isSymbolicLink()) throw new Error("Invalid release source file");
    const source = readFileSync(path);
    if (source.byteLength > ENGINE_LIMITS.legacyBytes) throw new Error("Legacy source byte limit exceeded");
    const meta = metadata.courses.find((course: { courseKey: string }) => course.courseKey === key);
    if (!meta || digest(source) !== meta.releasedPackageSha256) throw new Error("Legacy released package checksum mismatch");
    const pkg: InteractivePackage = interactivePackageSchema.parse(JSON.parse(source.toString("utf8")));
    if (pkg.courseKey !== key || pkg.examples.length !== meta.itemCount || canonicalJson(pkg.previewIds) !== canonicalJson(meta.previewIds)) throw new Error("Legacy metadata mismatch");
    courses[key] = compileCourse(outputDir, pkg);
    itemCount += pkg.examples.length;
  }
  if (itemCount !== metadata.counts.examples) throw new Error("Legacy total mismatch");
  const legacyMetadata = artifact(outputDir, "legacy-release-metadata.json", metadata, ENGINE_LIMITS.registrationBytes);
  const registration = engineRegistrationSchema.parse({ format: "interactive-engine-v1", version: "release-v1", legacyMetadata, courses });
  artifact(outputDir, "registry.json", registration, ENGINE_LIMITS.registrationBytes);
  return { outputDir, courseCount: approved.length, itemCount };
}
