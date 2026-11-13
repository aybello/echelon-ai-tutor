import { tsImport } from "tsx/esm/api";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

// Offline build only: JSON source reads, structural validation, no models or DB.
// Reusable imports do not compile or write anything automatically.
export async function compileInteractiveEngine(options = {}) {
  if (options.sourceDir !== undefined || options.additionalRecords !== undefined || options.checkedRelease !== undefined) {
    const { compileLegacyRelease } = await tsImport("../server/interactiveContent/engine/compiler.ts", import.meta.url);
    return compileLegacyRelease(options);
  }
  const { compileApprovedOrLegacyRelease } = await tsImport("./content-engine/committed-release.ts", import.meta.url);
  return compileApprovedOrLegacyRelease(options.outputDir);
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (process.argv.length !== 2) throw new Error("Usage: node scripts/compile-interactive-engine.mjs (no caller-supplied course paths)");
  const result = await compileInteractiveEngine();
  console.log(`Compiled ${result.courseCount} courses / ${result.itemCount} legacy and ${result.newItemCount ?? 0} approved additions to private ${result.outputDir}`);
}
