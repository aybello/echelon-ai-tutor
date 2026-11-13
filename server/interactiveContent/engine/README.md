# Private interactive content engine v1

This server-only filesystem adapter compiles the unchanged 38 software-approved packages in `release-2026-11-12`. The frozen legacy bank contains 3,821 examples in total, **not** 1,000 examples per course/mode. An explicitly supplied, checked private authoring document may add records to the indexed bank; see `docs/content-engine.md`. The target of 1,000 examples in each of six modes is a future course/mode target; it is not a per-filter quota or an advertised count. No generation, database writes, persisted game results, or readiness attribution happens here.

## Wire contract

`shared/interactiveSessions.ts` contains strict client-safe Zod input/output schemas, mode/difficulty enums and types, plus structural schemas for the existing drill payloads. It imports no server code or authored content. Both before/after variants remain valid.

Both new procedures are public POST mutations. `interactive.getCatalog({courseKey, accessToken?})` returns `{courseKey, available, locked, version, modes:[{mode,totalCount,topics:[{id,label,count}],difficulties:[{id,count}]}]}`. Counts are actual indexed bank counts, including for locked users; catalog metadata contains no prompts, answers, or explanations.

`interactive.startSession({courseKey,mode,sessionSize?,topicId?,difficulty?,accessToken?})` returns `{courseKey,available,locked,version,sessionId,mode,totalAvailableCount,examples,filters:{topicId,difficulty,requestedSize}}`. Size defaults to 20 and must be an integer from 5 to 50. Paid selection samples without replacement from the exact mode/topic/difficulty intersection; an unknown safe topic or empty intersection returns an available empty session with zero matching count, not an alternative topic. The `sessionId` is an ephemeral UUID, not a receipt or database key.

Locked inputs are syntactically validated, but topic/difficulty filters are deliberately ignored; resolved topic/difficulty fields are null. Exactly the preserved legacy preview for the requested mode is returned, with `totalAvailableCount: 1`. Refreshes, filters, sizes and the legacy compatibility endpoint cannot rotate the free union beyond its six original examples. Catalog totals describe the bank; session totals describe the actually eligible selection.

Every procedure sets `private, no-store` before input validation, rejects aliases/inactive/unknown courses and 309A, and calls the existing `resolveAccessForRequest(ctx, canonicalCourseKey, {accessToken, privilegedInteractiveAccess:true})` on each request. Access errors are not converted into free access or content fallbacks.

`getContent` returns only the preserved legacy package (at most 300 examples for paid access and the six fixed previews for free access), never the indexed expanded bank.

## Artifact format and validation

`registry.json` registers exactly the canonical 38 eligible courses and stores SHA-256/byte descriptors for course manifests. Manifests contain IDs, mode/topic/difficulty, shard offsets, per-example SHA-256/byte counts, preserved preview IDs and checked shard descriptors. Shards contain at most 100 examples, with smaller splits when needed to respect byte limits. Legacy compatibility files and the original release metadata are private checked artifacts.

Legacy manifests are labeled `legacy_release`; every existing entry has `topicId: "unclassified"` and `difficulty: "unclassified"`. This is a structural/software adapter, not a claim of objective alignment, technical approval, human review, jurisdictional accuracy or source currency. The preserved legacy release metadata describes the original review scope and limitations.

An opt-in checked expansion uses `legacy_plus_checked` and a public random release token pinned with the exact selection and private checked versions in the committed trusted-corpora approval; missing or mismatched bindings fail closed. Tokens are not secrets, content hashes, or proof of review. Each changed release needs a fresh token and approval. the legacy rows and compatibility package remain unchanged. The compiler checks documentary review and release gates without authenticating the declarations. Sources, review evidence and answer-bearing shards remain private server data and are not public assets.

Resource ceilings: 32 KiB per example, 1 MiB per shard, 4 MiB per course manifest, 64 KiB registration metadata, 2 MiB legacy compatibility package, 12,000 indexed examples per course, 256 KiB session JSON, and an LRU of at most 64 entries/16 MiB conservative decoded-object accounting. Byte budgets may return fewer examples than requested; `requestedSize` preserves the actual request and `totalAvailableCount` remains the truthful intersection size. Sampling never replaces a rejected item or switches its filters.

Runtime reads are lazy: catalog loads only registration and the requested course's index, while sessions read only selected shards. Each loaded shard is checksum-checked, structurally validated and checked against its manifest offsets, IDs, modes and item hashes before caching. Invalid/missing registered artifacts throw a generic configuration error; no alternate content source is attempted. Unselected shard bytes are intentionally not loaded merely to serve catalog metadata. A cache entry is invalidated on inode/size/mtime/ctime or expected checksum changes, and shard/legacy validation is tied to manifest context. Cached structures are deeply frozen. Checksums provide integrity against the registered manifest, not cryptographic approval/signing of externally modified release files.

Descriptor paths are exact canonical filenames; caller input never supplies a path. Traversal and symlink components are rejected. Source execution uses `server/interactiveContent/engine/release-v1`; an esbuild-bundled `dist/index.js` uses adjacent `dist/interactive-content`, with no cwd fallback. Missing bundled artifacts fail closed.

## Compile and build

From the repository root, use the isolated local command:

```sh
env -i PATH="$PATH" HOME=/tmp NODE_ENV=test node --require ./scripts/test-safety.cjs ./scripts/compile-interactive-engine.mjs
```

Compilation reads release JSON and constrained registration text from the filesystem, validates package hashes against preserved release metadata, and never imports registration content, conversion scripts or model clients. Its default output is server-only `engine/release-v1`. `scripts/buildServer.ts` retains the existing build identity checks, compiles these private artifacts, and copies them only to `dist/interactive-content` after bundling, never to `public` or `dist/public`.

Only the new backend tests were run:

```sh
env -i PATH="$PATH" HOME=/tmp NODE_ENV=test node --require ./scripts/test-safety.cjs ./node_modules/vitest/vitest.mjs run server/interactiveContent/engine/engine.test.ts server/interactiveContent/engine/router.test.ts --maxWorkers=1 --minWorkers=1
```

The targeted suite covers fixed-preview union, entitlement refresh/wrong-course access, canonical exclusion, strict wire validation, empty intersections, exact sampling, response limits, checksums, path/symlink rejection, cache invalidation, deterministic compilation of all 38 legacy packs, and a 6,006-example synthetic course with catalog-only index reads. A tiny isolated esbuild bundle verifies production path loading; no server launch, production build, deployment, database or model call is involved.
