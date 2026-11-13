# Offline interactive draft package helper

This tool creates **draft review artifacts only**. It does not review factual accuracy, establish that an AI actually performed a review, verify citations, approve content, activate content, modify the registry, or access a database/network. Human content and preview review remain necessary. The production `interactivePackageSchema` only accepts `status: "approved"`; a draft is intentionally **not** a valid/loadable production package. The tool validates the other strict server schema rules and refinements using a draft-status-only derivative, without ever fabricating an approved package.

## Input and usage

Wait until input generation is finished. Specify one regular JSON file containing the existing converter's root array of reviewed draft items (`id`, `mode`, `prompt`, `answer`, `explanation`, `sources`, `options`, `pairs`, and optional `instruction`). See `validate-interactive-drafts.mjs` for the full requirements. This helper does not automatically discover, merge, infer course metadata, or pick previews. Each file must include all six modes and at least one non-preview example per mode, for at most 300 examples total. Manual adaptation may be needed if the generated JSON has a different shape; unknown fields are rejected rather than discarded.

Provide a separate JSON file containing the actual AI reviewer metadata, e.g. `[{"type":"ai","name":"Example model"}]`. Names are operator-supplied and are not authenticated. Do not use this field to assert a human review. The full original source and reviewer files, including whitespace, are preserved in base64 in the provenance sidecar and hashed using SHA-256; citations and original answer/options/pairs are also retained there. The package hash covers the exact UTF-8 `package.json` bytes including the final newline. These files may contain sensitive source data; choose a suitably protected destination.

Example (replace every placeholder; the destination directory must not exist and must be outside the project):

```sh
node --import tsx scripts/assemble-interactive-draft-package.mjs assemble \
  --input /absolute/path/finished-reviewed-array.json \
  --course-key YOUR_EXACT_COURSE_KEY \
  --preview-ids '{"rapid-swipe":"RAPID_ID","speed-match":"MATCH_ID","odd-one-out":"ODD_ID","cause-effect":"CAUSE_ID","tap-the-flaw":"FLAW_ID","before-after":"ORDER_ID"}' \
  --status draft --version YOUR_VERSION \
  --reviewers /absolute/path/ai-reviewers.json \
  --out-dir /absolute/path/new-output-directory
```

Use `verify` instead of `assemble` with **the same arguments and original files** to reconstruct and compare exact bytes of `package.json` and `provenance.json` without writing. The SHA-256 hashes are integrity checks, not authenticated signatures: if input, metadata, and sidecar are all maliciously replaced, an independent trusted digest is needed to detect it. Successful verification proves consistency with supplied input, not correctness or approval.

Output creation uses an exclusive new directory and exclusive file creation. It never replaces an existing path or writes inside the project. Both source and reviewer inputs must be regular files, not final-component symlinks. Course key, input and output paths, and input contents identifying 309A are rejected conservatively (including 309-A spellings); this is not a semantic classifier for disguised 309A material. The operator remains responsible for ensuring the material belongs to the specified permitted course. Verification does not modify files. Nonzero exit indicates error. Do not add draft artifacts to the server loader or registry.

Run offline synthetic tests from the project root:

```sh
node --test scripts/assemble-interactive-draft-package.test.mjs scripts/validate-interactive-drafts.test.mjs
```
