# Production exam-question snapshot

Private/proprietary question content. Owner-authorized export of every stored row in the authoritative production `questions` table; not a public asset and not a learner-visible inventory.

- Export started (UTC): **2026-11-16T02:16:18.282Z**
- Export completed (UTC): **2026-11-16T02:16:20.913Z**
- Total rows: **24350** across **39** distinct stored bank keys. Empty banks cannot be inferred from this table.
- Directory date is UTC (2026-11-16); authorization/task date was 2026-11-15 Eastern Time.
- Source-code inspection revision: `c79be21ddb530e32773a48700fa647b939af0ecb` in the running app worktree. The export branch began at Claude revision `b486eb7091b7f4e28d92f60e93de517e82f8ec63`; see source-file hashes in `counts.json` because the Claude branch may contain different policy code.

## Source and read-only method

The running app's protected configuration and `server/db.ts:activeDatabaseSettings` selected the external target using `DATABASE_CUTOVER_USE_EXTERNAL_TARGET=true`, `EXTERNAL_DATABASE_URL`, `EXTERNAL_DATABASE_CA`, and the final database override `DATABASE_CUTOVER_TARGET_DATABASE`. The ordinary `DATABASE_URL` was not used. The effective protected settings matched this execution environment (CA compared after the app's PEM normalization). Connection options came directly from `server/_core/databaseTls.ts:databasePoolOptions`, with mandatory TLS and certificate verification. No host, database name, URL, credentials, certificate, or connection script is included here.

One direct `mysql2.createConnection` was used, not the application pool/router. The only SQL executed was `SHOW COLUMNS FROM questions` followed by the single SELECT recorded in `counts.json`. No WHERE filter, LIMIT, JOIN, writes, migrations, model/provider calls, or production API/progress requests were made. All per-bank counts and files were derived locally from that one streamed result.

No explicit read-only transaction was used because the preceding task context reported that syntax unsupported. This fallback provides a single-statement snapshot, not a separately verified multi-statement repeatable-read transaction or database-wide backup. No other table was read, counted, joined, or exported.

## Fields and faithful serialization

Each JSON file is an array with the explicit columns: `id`, `bankKey`, `questionNum`, `module`, `difficulty`, `question`, `options`, `correctIndex`, `explanation`, `steps`, `tip`, `isCalc`, `topic`, `cognitiveLevel`, `reviewStatus`. The requested correct answer index and explanation are question-authoring content, not student answers. Rows sort by numeric `questionNum`, then `id`; filenames use a `bank-` prefix and percent-escaped bank keys with collision checks. UTF-8 JSON is indented with LF and a final newline; U+2028/U+2029 are escaped. Nulls, text, Unicode, identifiers, and review-status values are preserved. `options` and `steps` retain their original database TEXT strings (including embedded JSON), rather than silently parsing/reformatting them.

The actual schema contains `reviewStatus`; it has no dedicated live/hidden/paused/approved boolean columns. The full column-name inventory is in `counts.json`. Excluded question columns are `sourceTitle`, `sourceReference`, `sourceUrl`, `blueprintObjective`, `reviewedBy`, and `reviewedAt`: they are outside the requested question payload; reviewer identity is deliberately omitted. No customer/user records, attempts, student answers, emails, payment data, credentials, or other-table content is included.

## Availability is not inferred

This export includes **all** stored questions, including held/rejected content. In the inspected running source, `server/questionGovernance.ts:learnerVisibleQuestionFilter` applies `reviewStatus NOT IN ('in_review', 'rejected')`, using `shared/questionVisibility.mjs`. Both `approved` and legacy `unreviewed` rows pass that review-status gate; passing it is not proof that a row is currently delivered. There is no invented `isLive` or `isPaused` field.

Actual delivery also depends on canonical course-to-bank mapping and `isActive` in `shared/courseRegistry.ts`, the active-course guard in `server/courseActivityScope.ts`, access/preview limits, module/topic/calculation/difficulty filters, and route-specific selection in `server/routers/quizRouter.ts`. Review-mode identity filters and receipt/access checks are outside this export. Other product/release policies may affect other delivery surfaces; no release table was read, and no assertion is made that a stored bank is released, unpaused, approved for commerce, or visible to any particular learner. Certification-specific tables/content are intentionally excluded because only `questions` was authorized. This is a raw production-table snapshot, not a reconstruction of all product exam content.

## Counts and integrity

`counts.json` records global/per-bank row counts, raw review-status counts, the exact SELECT, selected/omitted/actual column names, source-code hashes, and each bank-file SHA-256. `SHA256SUMS` covers every JSON file plus this README (it excludes itself to avoid a self-referential digest). Verify from this directory with `sha256sum -c SHA256SUMS`.

| Bank key | Rows | File | SHA-256 |
|---|---:|---|---|
| class1 | 250 | `bank-class1.json` | `6ce05f39e0a62e4018a99d9308545e70032158320ceffb4b1ef47a67a12c2c5e` |
| class1-wastewater | 815 | `bank-class1-wastewater.json` | `1ce4721344c63b6cd3fa2b8492dbade68af8a1627ba501ba170913a5bbde9e98` |
| class1-wastewater-coll | 974 | `bank-class1-wastewater-coll.json` | `25a05c2c777183fe34e214dfddf28d7165d8ef5d07cacb8a23d2c28599ac1e43` |
| class1-water | 805 | `bank-class1-water.json` | `2d00700c2c4aa044adae6fdad9f9619c7f7f6b87ed81ae550f9155d84cb58942` |
| class1-water-dist | 966 | `bank-class1-water-dist.json` | `be018c573f9e04f11403ecd5e3c777259357babb1e66e8e99e6417edc54658c0` |
| class2-wastewater | 796 | `bank-class2-wastewater.json` | `a8f93d1356269ddc8ca4b075ee82570e149fc8f7cdca1dbe245b376e0d2a3665` |
| class2-wastewater-coll | 810 | `bank-class2-wastewater-coll.json` | `aed53e1f633ca19b182c4b9583ced6034c036c5d53046759c50f41fa1fb6b736` |
| class2-water | 753 | `bank-class2-water.json` | `a0ce798c806d0217808bfb541c66d277a74367411091fbb800e116b5a52ebada` |
| class2-water-dist | 785 | `bank-class2-water-dist.json` | `51a2dcf8dc609e60f85118a49bf9a00c84dda2b1f90ed41f5ea1f25974c73cd6` |
| class3-wastewater | 580 | `bank-class3-wastewater.json` | `a5f9a2951ad7d2de175d18bb6d79d29e3a5f18e3ce0daedc86ac2fa8ea3b9f91` |
| class3-wastewater-coll | 572 | `bank-class3-wastewater-coll.json` | `25eb6075b97e46f0d6a72784f2f1ed4241bb5ce310a07d24f0f356662c2b49c8` |
| class3-water | 563 | `bank-class3-water.json` | `4fee82ca21b0d59c7d56b280955b2b229783b127f8ddc1fdd576966df7783b3b` |
| class3-water-dist | 821 | `bank-class3-water-dist.json` | `fa1d418daa3bf326fd53dce3be5ee2584edc2f66c2384e628b24c9d868a57b1d` |
| class4-wastewater | 588 | `bank-class4-wastewater.json` | `7f1ee445573ad4f7b8b7bc32dd3d64c69cdf06480b65ed13bd8a56e896775c74` |
| class4-wastewater-coll | 570 | `bank-class4-wastewater-coll.json` | `d981e30d8fbd319901314b5ffae9d509f0d98f3a4366a88b7d43d67f6cc1f7a1` |
| class4-water | 569 | `bank-class4-water.json` | `91998c49368ccdf14eb1879cddc345a24673abae906c1b1efffee5f61f5cae14` |
| class4-water-dist | 568 | `bank-class4-water-dist.json` | `cb95f1ae3989105b66cbe021b1e7fb0ecf67e5c72420e55c450c99fccae8a39c` |
| oit | 1038 | `bank-oit.json` | `160b22229c65a320ba51fb2117abe752437fd90bf20af4ad037f5e11249f1957` |
| oit-ww | 1033 | `bank-oit-ww.json` | `18315c0566e325c132555c043b8954f2d18a6a112b166b3e26c9299100f15e1a` |
| us-class1-water | 200 | `bank-us-class1-water.json` | `925ef107fddd2a95f9a142194d46f4103580c750378d5ffd1160aeeaa00bf68c` |
| us-class1-water-dist | 198 | `bank-us-class1-water-dist.json` | `79ccded5bf97cabc75723fed9f7421cadeb26de45797dd8a44c8f49501bdd10b` |
| us-texas-class-d-water | 120 | `bank-us-texas-class-d-water.json` | `bb0a7c84ffb2da27531d1cbea77cba71ee30a971aca3194fe2fac0f323a7e00f` |
| wpi-class1-wastewater | 594 | `bank-wpi-class1-wastewater.json` | `bc84900ba7975aa655c273b5e55aedf78309293e8683756250713da545be1caa` |
| wpi-class1-wastewater-coll | 499 | `bank-wpi-class1-wastewater-coll.json` | `18b202c8082237cebe6ae0a83487477e6847cd59c501476a7c5df702f5b18bfe` |
| wpi-class1-water | 598 | `bank-wpi-class1-water.json` | `e4c43e44d704b05d1e0235ca6054ecfcb74db1fe9ca64b6b9215e79f573a0aa8` |
| wpi-class1-water-dist | 500 | `bank-wpi-class1-water-dist.json` | `eb6afadf4f97badd352f580a2d6c1d2bb8c2dc126b380eb63d6894567f16e91c` |
| wpi-class2-wastewater | 599 | `bank-wpi-class2-wastewater.json` | `03b842c6db1dc832b67effcea1d448b176c6e6bec5c4a7a3dd079855b75471cb` |
| wpi-class2-wastewater-coll | 503 | `bank-wpi-class2-wastewater-coll.json` | `6607639a9d7b3d754c0f642412aff3c4325111b56c6745757c02fac0aa68a47d` |
| wpi-class2-water | 598 | `bank-wpi-class2-water.json` | `2843f128e28f54e0cb7662d2c0e854069a30d834c87e42239629dfa71b4f5363` |
| wpi-class2-water-dist | 595 | `bank-wpi-class2-water-dist.json` | `938332bfd10709c7be38d1ea02b6952cb173c5557132096c4d13011e64b9f679` |
| wpi-class3-wastewater | 607 | `bank-wpi-class3-wastewater.json` | `02d4c9abc0a85f98b455d7fe80b682b1e9b960cd003ef2bf53a20d68d139893d` |
| wpi-class3-wastewater-coll | 503 | `bank-wpi-class3-wastewater-coll.json` | `d3226598016d53ee58fd81dbd94c21c57b848e58ae755637b880cee06b71b5e7` |
| wpi-class3-water | 561 | `bank-wpi-class3-water.json` | `afc0832b9a92c39fff8b65c7cd3892cf2b9bbe93ddb2f881119361af42a3d078` |
| wpi-class3-water-dist | 611 | `bank-wpi-class3-water-dist.json` | `fdbe7ee955265ac07e27790d84c7ba82a42d6f339e02e6f4efae92770cac77ea` |
| wpi-class4-wastewater | 907 | `bank-wpi-class4-wastewater.json` | `55eab1bccc5f551d5d54762b0dfa8c2f04f2b0f149c7a90e4f08b89118fd5400` |
| wpi-class4-wastewater-coll | 503 | `bank-wpi-class4-wastewater-coll.json` | `0316d2a8267427d625f285b5aec7978a341c9f86789ee5fb91b048ec6b5dbc42` |
| wpi-class4-water | 678 | `bank-wpi-class4-water.json` | `1e409443dd96a5600bea4a5e4c0fb72935e6724de25bbd4f4cd9cd313c846495` |
| wpi-class4-water-dist | 620 | `bank-wpi-class4-water-dist.json` | `2e439299a3c8aeb306c97e94bb8b05f8dee378aef3fb825921c5fd4ac39f5457` |
| wqa | 500 | `bank-wqa.json` | `682099adfeb192168dc12160c475e8569b9e053a33668b1ee7dd3935a8d72705` |
