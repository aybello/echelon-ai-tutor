# Server-only interactive content engine v1

This filesystem adapter compiles the unchanged 38 software-approved packages in `release-2026-11-12`. The frozen legacy bank contains 3,821 examples in total, **not** 1,000 examples per course/mode. An explicitly supplied, checked private authoring document may add records to the indexed bank; see `docs/content-engine.md`. The target of 1,000 examples in each of six modes is a future course/mode target, not an advertised count. No generation, database writes, persisted game results, or readiness attribution happens here.

## Public game access policy, 2026-11-13

The founder explicitly authorized full access to the published game banks for everyone, including visitors without an account. This rule is confined to `interactive.getContent`, `interactive.getCatalog`, and `interactive.startSession`. The router supplies a server-owned full-access flag to the engine without querying purchases, subscriptions, team assignments, or admin roles. It does not alter shared access guards, `FREE_EXAM_TYPES`, ordinary quiz delivery, mock exams, pricing, checkout, account roles, or customer entitlements. The separate DB-backed `quiz.getInteractiveQuestions` endpoint is not this authored-game bank and keeps its existing rules.

All 38 active canonical game courses are eligible; 309A, course aliases, unknown and inactive courses remain excluded. Public access does not approve or activate private generated drafts. The checked-content approval and active-release registries remain empty.

## Wire contract

`shared/interactiveSessions.ts` contains strict client-safe Zod input/output schemas and existing drill payload shapes. It imports no server code or authored content. Both before/after variants remain valid.

All three procedures are POST mutations. `interactive.getCatalog({courseKey, accessToken?})` returns `{courseKey, available, locked, version, modes:[{mode,totalCount,topics:[{id,label,count}],difficulties:[{id,count}]}]}`. Public game responses are unlocked. Counts are actual indexed bank counts; catalog metadata contains no prompts, answers, or explanations. Optional bounded access tokens remain accepted for compatibility but are not used as a public-game gate.

`interactive.startSession({courseKey,mode,sessionSize?,topicId?,difficulty?,accessToken?})` returns `{courseKey,available,locked,version,sessionId,mode,totalAvailableCount,examples,filters:{topicId,difficulty,requestedSize}}`. Size defaults to 20 and must be an integer from 5 to 50. Selection samples without replacement from the exact mode/topic/difficulty intersection. An unknown safe topic or empty intersection returns an available empty session with zero matching count, not another topic. The `sessionId` is an ephemeral UUID, not a receipt or database key.

Every procedure sets `private, no-store` before input validation, rejects unavailable course keys, and fails closed on corrupt or unregistered artifacts. Public access is not a fallback after an authorization error. `getContent` returns only the preserved legacy package, at most 300 examples, never the indexed expanded bank. The engine's lower-level locked-preview branch and original preview IDs remain for compatibility and internal tests; the three public routes no longer use it.

## Artifact format and validation

`registry.json` registers exactly the canonical 38 eligible courses and stores SHA-256/byte descriptors for course manifests. Manifests contain IDs, mode/topic/difficulty, shard offsets, per-example SHA-256/byte counts, preserved preview IDs and checked shard descriptors. Shards contain at most 100 examples, with smaller splits when needed to respect byte limits. Artifacts and original release metadata are server-only, not static public files. Published game prompts, answers and explanations are delivered through the bounded game API. Private source snapshots, authoring metadata and review evidence are not copied to learner responses.

Legacy manifests are labeled `legacy_release`; every existing entry has `topicId: "unclassified"` and `difficulty: "unclassified"`. This is a structural/software adapter, not a claim of objective alignment, technical approval, human review, jurisdictional accuracy or source currency. The preserved legacy release metadata describes the original review scope and limitations.

An opt-in checked expansion uses `legacy_plus_checked` and a public random release token pinned with the exact selection and private checked versions in the committed trusted-corpora approval. Independently reviewed `activeCheckedReleases` bindings must pin the exact private compiled manifest SHA-256 and its approval ID for each active course. Both registries are empty: there are no checked approvals or active releases. The pin must be separately reviewed and committed, never accepted from a request, mutable output, or environment. Changing content requires a new approval, fresh public token and new pin. Active pins prevent silent downgrade to legacy. The compiler verifies the written manifest, legacy resource and full shards after compiling and fails on a missing or mismatched pin. A failed direct compilation may leave partial files: discard the output; the private CLI removes its failed staging directory. Documentary gates do not authenticate declarations.

Resource ceilings: 32 KiB per example, 1 MiB per shard, 4 MiB per course manifest, 64 KiB registration metadata, 2 MiB legacy compatibility package, 12,000 indexed examples per course, 256 KiB session JSON, and an LRU of at most 64 entries/16 MiB conservative decoded-object accounting. Byte budgets may return fewer examples than requested. Sampling never replaces a rejected item or switches its filters.

Runtime reads are lazy: catalog loads only registration and the requested course's index, while sessions read only selected shards. Each loaded shard is checksum-checked, structurally validated and checked against its manifest offsets, IDs, modes and item hashes before caching. Invalid/missing registered artifacts throw a generic configuration error; no alternative content source is attempted. Unselected shard bytes are not loaded merely to serve catalog metadata. Checked courses rehash actual manifest and selected shard bytes against their committed pins on every read, even on a cache hit. Legacy cache behavior uses inode/size/mtime/ctime and expected checksum changes. Cached structures are deeply frozen. Pins do not protect against compromise of trusted application code or its approval registry.

Descriptor paths are exact canonical filenames; caller input never supplies a path. Traversal and symlink components are rejected. Source execution uses `server/interactiveContent/engine/release-v1`; an esbuild-bundled `dist/index.js` uses adjacent `dist/interactive-content`, with no cwd fallback. Missing bundled artifacts fail closed.

## Compile and build

From the repository root, use the isolated local command:

```sh
env -i PATH="$PATH" HOME=/tmp NODE_ENV=test node --require ./scripts/test-safety.cjs ./scripts/compile-interactive-engine.mjs
```

Compilation reads release JSON and constrained registration text from the filesystem, validates package hashes against preserved release metadata, and never imports model clients. Its default output is server-only `engine/release-v1`. `scripts/buildServer.ts` compiles these artifacts and copies them only to `dist/interactive-content` after bundling, never to `public` or `dist/public`.

Targeted credential-free tests include public anonymous full game access, unchanged regular quiz paywalls, canonical exclusions, strict POST/no-store wire validation, bounded sampling, empty intersections, response limits, checksums, path/symlink rejection, cache invalidation, and deterministic compilation of the 38 unchanged legacy packs. Run only selected tests with the test-safety guard and all live credentials stripped. Tests are software checks, not content-expert approval or proof of deployment.
