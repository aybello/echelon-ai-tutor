import { loadManifest, validateManifest } from "./migrationSafety.ts";

const manifest = await loadManifest();
const errors = await validateManifest(manifest);

if (errors.length > 0) {
  console.error("Forward migration verification failed:\n");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(
    `Migration manifest is valid: baseline ${manifest.baseline.version}, ${manifest.migrations.length} forward migration(s).`
  );
}
