# Server-only six-game registration

These packages contain answer keys. Do not import into client code or copy to public assets. Provenance and evidence are server-only and are never sent by the interactive router.

The 38 active canonical non-309 packages retain 3,984 AI-authored, AI-source-reviewed items. No human subject-matter review or instructor validation is claimed. The prior offline screening removed 73 identified items from 4,057, but did not establish remaining content is accurate, safe, current, legally compliant, or free of all legal claims. Coverage is not represented as complete. The unchanged production release gate, including its content authority requirements, remains applicable.

User authorization enables software registration, not production deployment. Runtime schema requires status `approved`; the deterministic import changes only that field from the stored draft, and the registry's approval flag is likewise a software eligibility flag. Neither constitutes factual validation. Fixed previews are the lexicographically smallest IDs in each mode, not editorially reviewed. The original candidate metadata and sidecars retain the historical candidate status and original hashes; release-metadata.json maps each candidate and source hash to its release hash.

## Reproduce

From repository root, with the original candidate, its release-scoped source files and referenced reviews available: `node --import tsx scripts/import-echelonsix-release.mjs verify`. For a fresh import move this directory aside and run the same command with `assemble`; it refuses to overwrite. The source candidate derives from `scripts/assemble-echelonsix-candidate.mjs` and the release-scoped variant documented in candidate-metadata.json. Before registration, both candidate assemblers verified successfully. Their metadata includes the then-current loader hash, so changing the loader for registration makes their historical whole-candidate verification sensitive to that deliberate change. The import pins the pre-registration candidate metadata hash and verifies source, package, provenance, and review references. No network, database or deployment is used.
