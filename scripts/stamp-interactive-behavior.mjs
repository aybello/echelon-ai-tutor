// Offline behavior stamp maintenance. The independent effectiveReleaseVersion
// regression must continue to verify this nine-source, zero-normalized contract.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

if (process.argv.slice(2).some(arg => arg !== "--write")) {
  throw new Error("Usage: node scripts/stamp-interactive-behavior.mjs [--write]");
}
const loader = "server/interactiveContent/engine/loader.ts";
const pattern = /export const BEHAVIOR_POLICY_SHA256 = "[a-f0-9]{64}";/g;
const hash = createHash("sha256");
for (const path of [
  loader,
  "server/interactiveContent/engine/overlay.ts",
  "server/interactiveContent/engine/reviewReceipt.ts",
  "server/interactiveContent/engine/modeFit.ts",
  "server/interactiveContent/engine/schema.ts",
  "server/interactiveContent/schema.ts",
  "shared/interactiveCauseEffect.ts",
  "shared/interactiveSessions.ts",
  "shared/courseRegistry.ts",
]) {
  let source = readFileSync(path, "utf8");
  if (path === loader) {
    if ([...source.matchAll(pattern)].length !== 1) throw new Error("Expected exactly one behavior stamp");
    source = source.replace(pattern, `export const BEHAVIOR_POLICY_SHA256 = "${"0".repeat(64)}";`);
  }
  hash.update(path + "\0");
  hash.update(source);
  hash.update("\0");
}
const digest = hash.digest("hex");
console.log(digest);
if (process.argv.includes("--write")) {
  const source = readFileSync(loader, "utf8");
  writeFileSync(loader, source.replace(pattern, `export const BEHAVIOR_POLICY_SHA256 = "${digest}";`));
}
