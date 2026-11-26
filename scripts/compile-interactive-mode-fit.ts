// Regenerates server/interactiveContent/engine/modeFitExclusions.json from the stored bank.
// Offline and read-only apart from that one file. Run with the test-safety guard:
//   env -i PATH="$PATH" HOME=/tmp NODE_ENV=test node --require ./scripts/test-safety.cjs --import tsx scripts/compile-interactive-mode-fit.ts
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { InteractiveContentEngine } from "../server/interactiveContent/engine/loader";
import { computeModeFitExclusions } from "../server/interactiveContent/engine/modeFit";

const engineDir = join(dirname(fileURLToPath(import.meta.url)), "../server/interactiveContent/engine");
const registry = JSON.parse(readFileSync(join(engineDir, "release-v1/registry.json"), "utf8")) as { courses: Record<string, unknown> };
const exclusions = computeModeFitExclusions(new InteractiveContentEngine(), Object.keys(registry.courses));
writeFileSync(join(engineDir, "modeFitExclusions.json"), `${JSON.stringify(exclusions, null, 2)}\n`);
const total = Object.values(exclusions.courses).reduce((sum, ids) => sum + ids.length, 0);
console.log(`Cause and Effect mode-fit exclusions: ${total} items in ${Object.keys(exclusions.courses).length} courses.`);
